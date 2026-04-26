<?php

namespace App\Application;

use App\Models\Order;
use App\Models\Payment;
use Core\Database;

class PaymentService
{
    public function processPayment(int $orderId, string $method, float $amount): array
    {
        $db = Database::getInstance();

        $order = Order::find($orderId);
        if (!$order) {
            throw new \Exception('Order not found');
        }

        // 1. Xác định trạng thái dựa trên phương thức
        $status = in_array($method, ['card', 'e_wallet']) ? 'paid' : 'pending';

        // 2. Tạo bản ghi Payment
        $transactionRef = strtoupper(bin2hex(random_bytes(5)));
        $payment = Payment::create([
            'order_id' => $orderId,
            'payment_method' => $method,
            'amount' => $amount,
            'status' => $status,
            'transaction_ref' => $transactionRef,
            'paid_at' => $status === 'paid' ? date('Y-m-d H:i:s') : null,
        ]);

        // 3. Cập nhật Order status để chuyển qua Sales Verification
        // Không set 'verified' - chỉ update status để follow workflow
        if ($status === 'paid') {
            $order->update([
                'status' => 'paid',
                // Nhân viên sales sẽ verify sau
            ]);
        }

        return $payment->toArray();
    }

    public function confirmPayment(int $paymentId): array
    {
        $payment = Payment::find($paymentId);
        if (!$payment) {
            throw new \Exception('Payment not found');
        }

        if ($payment->status === 'paid') {
            return $payment->toArray();
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => date('Y-m-d H:i:s'),
        ]);

        $order = Order::find($payment->order_id);
        if ($order && $order->status === 'pending') {
            $order->update([
                'status' => 'paid',
                // Nhân viên sales sẽ verify sau
            ]);
        }

        return $payment->toArray();
    }

    /**
     * Lấy thông tin thanh toán của một đơn hàng.
     */
    public function getPaymentByOrderId(int $orderId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM payment WHERE order_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$orderId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Lấy danh sách thanh toán đang chờ xác nhận (Staff)
     */
    public function getPendingPayments(): array
    {
        $db = Database::getInstance();
        $stmt = $db->query("
            SELECT p.*, o.order_number 
            FROM payment p 
            LEFT JOIN `order` o ON o.id = p.order_id 
            WHERE p.status = 'pending' 
            ORDER BY p.created_at ASC
        ");
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}