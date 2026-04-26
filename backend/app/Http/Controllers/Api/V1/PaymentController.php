<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\PaymentService;
use Core\ApiResponse;
use Exception;

class PaymentController extends BaseController
{
    private PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Customer: Chọn phương thức và xử lý thanh toán khi đặt hàng
     */
    public function process()
    {
        $input   = $this->getJsonInput();
        $orderId = $input['order_id'] ?? null;
        $method  = $input['method'] ?? 'cod';
        $amount  = $input['amount'] ?? 0;

        if (!$orderId) {
            return ApiResponse::validationError('Order ID is required');
        }

        try {
            $payment = $this->paymentService->processPayment((int) $orderId, $method, (float) $amount);
            return ApiResponse::success($payment, 'Payment processed successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Staff: Xác nhận đã thu tiền thủ công (Bank Transfer / COD sau giao hàng)
     */
    public function confirm()
    {
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

        $input     = $this->getJsonInput();
        $paymentId = $input['payment_id'] ?? null;

        if (!$paymentId) {
            return ApiResponse::validationError('Payment ID is required');
        }

        try {
            $payment = $this->paymentService->confirmPayment((int) $paymentId);
            return ApiResponse::success($payment, 'Payment confirmed successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Lấy thông tin thanh toán của một đơn hàng (GET /payments/status?order_id=X)
     */
    public function status()
    {
        $orderId = $this->query('order_id');

        if (!$orderId) {
            return ApiResponse::validationError('order_id query parameter is required');
        }

        try {
            $payment = $this->paymentService->getPaymentByOrderId((int) $orderId);

            if (!$payment) {
                return ApiResponse::notFound('No payment found for this order');
            }

            return ApiResponse::success($payment);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Lấy danh sách các thanh toán đang chờ xác nhận (Staff) - GET /payments/pending
     */
    public function pendingPayments()
    {
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

        try {
            $rows = $this->paymentService->getPendingPayments();
            return ApiResponse::success($rows);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }
}
