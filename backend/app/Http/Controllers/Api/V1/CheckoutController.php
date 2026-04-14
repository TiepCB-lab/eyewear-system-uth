<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\CheckoutService;
use Exception;

class CheckoutController
{
    private CheckoutService $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
    }

    /**
     * Xử lý đặt hàng.
     */
    public function store()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['shipping_address'])) {
            http_response_code(400);
            return ['message' => 'Shipping address is required.'];
        }

        try {
            $order = $this->checkoutService->processCheckout($userId, $data);
            return [
                'message' => 'Order placed successfully',
                'data' => $order
            ];
        } catch (Exception $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        }
    }

    private function getCurrentUserId()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            try {
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                return (int) $parts[0];
            } catch (Exception $e) {
                return null;
            }
        }
        return null;
    }
}
