<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\SalesVerificationService;
use Core\ApiResponse;
use Exception;

class SalesController extends BaseController
{
    private SalesVerificationService $salesService;

    public function __construct(SalesVerificationService $salesService)
    {
        $this->salesService = $salesService;
    }

    /**
     * Get orders for sales staff (with filtering).
     */
    public function listOrders()
    {
        try {
            $filters = $_GET;
            $orders = $this->salesService->getAllOrders($filters);
            return ApiResponse::success($orders);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Verify order (Staff only).
     */
    public function verify()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::forbidden();
        }

        $input   = $this->getJsonInput();
        $orderId = $input['order_id'] ?? null;

        if (!$orderId) {
            return ApiResponse::validationError('order_id is required');
        }

        try {
            $order = $this->salesService->verifyOrder((int) $orderId, $userId);
            return ApiResponse::success($order, 'Order verified and moved to production successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Process complaint (Staff only).
     */
    public function complaint()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::forbidden();
        }

        $input   = $this->getJsonInput();
        $orderId = $input['order_id'] ?? null;
        $type    = $input['type']     ?? null;
        $reason  = $input['reason']   ?? '';

        $allowed = ['exchange', 'return', 'refund', 'warranty'];
        if (!$orderId || !$type) {
            return ApiResponse::validationError('order_id and type are required');
        }
        if (!in_array($type, $allowed, true)) {
            return ApiResponse::validationError('Invalid type. Allowed: ' . implode(', ', $allowed));
        }

        try {
            $result = $this->salesService->processComplaint((int) $orderId, $type, $reason, $userId);
            return ApiResponse::success($result, "Complaint ({$type}) processed successfully");
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Update prescription for an order item.
     */
    public function updatePrescription()
    {
        $input = $this->getJsonInput();
        $orderItemId = $input['order_item_id'] ?? null;
        
        if (!$orderItemId) {
            return ApiResponse::validationError('order_item_id is required');
        }
        
        try {
            $this->salesService->updatePrescription((int)$orderItemId, $input);
            return ApiResponse::success(null, 'Prescription updated successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Get single order detail for staff.
     */
    public function showOrder($id)
    {
        try {
            $orderService = new \App\Application\OrderService();
            $order = $orderService->getOrderDetail((int)$id);
            
            if (!$order) {
                return ApiResponse::notFound('Order not found');
            }
            
            return ApiResponse::success($order);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }
}
