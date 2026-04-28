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
     * Get pending orders for verification (Staff only).
     */
    public function pendingOrders()
    {
        try {
            $orders = $this->salesService->getPendingOrders();
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
     * Get order complaints history.
     */
    public function orderComplaints()
    {
        $orderId = $this->query('order_id');
        if (!$orderId) {
            return ApiResponse::validationError('order_id query parameter is required');
        }

        try {
            $complaints = $this->salesService->getOrderComplaints((int)$orderId);
            return ApiResponse::success($complaints);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }
}
