<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\PaymentService;

class PaymentController
{
    private PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function process(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $orderId = $input['order_id'] ?? null;
        $method = $input['method'] ?? 'cod';
        // Mocking amount since order tracking module would usually compute or pass it
        $amount = $input['amount'] ?? 100.00;

        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'Order ID is required'];
        }

        try {
            $payment = $this->paymentService->processPayment($orderId, $method, $amount);
            return [
                'data' => $payment,
                'message' => 'Payment processed successfully'
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
