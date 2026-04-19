<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\PaymentService;
use App\Models\Payment;
use Core\Database;

class PaymentController
{
    private PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Customer: Chọn phương thức và xử lý thanh toán khi đặt hàng
     */
    public function process(): array
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $orderId = $input['order_id'] ?? null;
        $method  = $input['method'] ?? 'cod';
        $amount  = $input['amount'] ?? 100.00;

        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'Order ID is required'];
        }

        try {
            $payment = $this->paymentService->processPayment((int) $orderId, $method, (float) $amount);
            return [
                'data'    => $payment,
                'message' => 'Payment processed successfully',
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Staff: Xác nhận đã thu tiền thủ công (Bank Transfer / COD sau giao hàng)
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

    /**
     * Lấy thông tin thanh toán của một đơn hàng (GET /payments/status?order_id=X)
     */
    public function status(): array
    {
        $orderId = $_GET['order_id'] ?? null;

        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'order_id query parameter is required'];
        }

        try {
            $db   = Database::getInstance();
            $stmt = $db->prepare("SELECT * FROM payment WHERE order_id = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([(int) $orderId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$row) {
                http_response_code(404);
                return ['error' => 'No payment found for this order'];
            }

            return ['data' => $row];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Lấy danh sách các thanh toán đang chờ xác nhận (Staff) - GET /payments/pending
     */
    public function pendingPayments(): array
    {
        try {
            $db   = Database::getInstance();
            $stmt = $db->query("SELECT p.*, o.order_number FROM payment p LEFT JOIN `order` o ON o.id = p.order_id WHERE p.status = 'pending' ORDER BY p.created_at ASC");
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            return [
                'data' => $rows,
                'meta' => ['total' => count($rows)],
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }
}
