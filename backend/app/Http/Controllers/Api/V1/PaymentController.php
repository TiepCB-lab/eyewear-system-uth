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
/**
     * Customer gọi: Chọn phương thức và xử lý thanh toán khi đặt hàng
     */
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

/**
     * Staff gọi: Xác nhận đã thu tiền thủ công (Bank Transfer / COD sau giao hàng)
     */
    public function confirm(): array
    {
        $input     = json_decode(file_get_contents('php://input'), true) ?? [];
        $paymentId = $input['payment_id'] ?? null;

        if (!$paymentId) {
            http_response_code(400);
            return ['error' => 'Payment ID is required'];
        }

        try {
            $payment = $this->paymentService->confirmPayment((int) $paymentId);
            return [
                'data'    => $payment,
                'message' => 'Payment confirmed successfully',
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
