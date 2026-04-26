<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\OrderService;
use Core\ApiResponse;
use Exception;

class OrderController extends BaseController
{
    private OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $orders = $this->orderService->getOrdersForUser($userId);
            return ApiResponse::success($orders);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    public function show()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $orderId = $this->query('id');
        if (!$orderId) {
            return ApiResponse::validationError('order_id is required');
        }

        try {
            $order = $this->orderService->getOrderDetailForUser($userId, (int) $orderId);
            if (!$order) {
                return ApiResponse::notFound('Order not found');
            }

            return ApiResponse::success($order);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }
}
