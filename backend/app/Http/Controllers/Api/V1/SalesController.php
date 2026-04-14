<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\SalesVerificationService;

class SalesController
{
    private SalesVerificationService $salesService;

    public function __construct(SalesVerificationService $salesService)
    {
        $this->salesService = $salesService;
    }

    public function pendingOrders(): array
    {
        try {
            $orders = $this->salesService->getPendingOrders();
            return [
                'data' => $orders,
                'meta' => ['total' => count($orders)]
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    public function verify(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $orderId = $input['order_id'] ?? null;
        
        // Mock staff user ID logic for local testing without hard Auth deps
        $staffId = 2; // Assuming ID 2 is a staff role

        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'Order ID is required'];
        }

        try {
            $order = $this->salesService->verifyOrder($orderId, $staffId);
            return [
                'data' => $order,
                'message' => 'Order verified successfully'
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
