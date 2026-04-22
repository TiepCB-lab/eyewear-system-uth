<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\OrderService;

class OrderController
{
    private OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(): array
    {
        $userId = $this->resolveUserIdFromAuthorization();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        try {
            $orders = $this->orderService->getOrdersForUser($userId);
            return [
                'data' => $orders,
                'meta' => [
                    'total' => count($orders),
                ],
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    public function show(): array
    {
        $userId = $this->resolveUserIdFromAuthorization();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $orderId = $_GET['id'] ?? null;
        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'order_id is required'];
        }

        try {
            $order = $this->orderService->getOrderDetailForUser($userId, (int) $orderId);
            if (!$order) {
                http_response_code(404);
                return ['error' => 'Order not found'];
            }

            return ['data' => $order];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    private function resolveUserIdFromAuthorization(): ?int
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authHeader, 7));
        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }

        $parts = explode(':', $decoded);
        if (count($parts) < 1 || !is_numeric($parts[0])) {
            return null;
        }

        return (int) $parts[0];
    }
}
