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

        // 1. Xác định trạng thái thanh toán dựa trên phương thức (case-insensitive)
        $methodLower = strtolower($method);
        $paymentStatus = in_array($methodLower, ['card', 'e_wallet', 'momo']) ? 'paid' : 'pending';

        // 2. Tạo bản ghi Payment (chỉ record payment, không update order status)
        $transactionRef = strtoupper(bin2hex(random_bytes(5)));
        $payment = Payment::create([
            'order_id' => $orderId,
            'payment_method' => $method,
            'amount' => $amount,
            'status' => $paymentStatus,
            'transaction_ref' => $transactionRef,
            'paid_at' => $paymentStatus === 'paid' ? date('Y-m-d H:i:s') : null,
        ]);

        // Order status vẫn 'pending' cho đến khi staff verify

        return $payment->toArray();
    }

    public function confirmPayment(int $paymentId): array
    {
        $db = Database::getInstance();
        
        $payment = Payment::find($paymentId);
        if (!$payment) {
            throw new \Exception('Payment not found');
        }

        if ($payment->status === 'paid') {
            return $payment->toArray();
        }

        // Explicitly update payment status via database query
        $updateStmt = $db->prepare("
            UPDATE payment 
            SET status = 'paid', paid_at = NOW() 
            WHERE id = ?
        ");
        $updateStmt->execute([$paymentId]);

        // Also update order status if it's still pending
        $order = Order::find($payment->order_id);
        if ($order && $order->status === 'pending') {
            $orderUpdateStmt = $db->prepare("
                UPDATE `order` 
                SET status = 'paid', updated_at = NOW() 
                WHERE id = ?
            ");
            $orderUpdateStmt->execute([$order->id]);
        }

        // Fetch updated payment from database
        $refreshStmt = $db->prepare("SELECT * FROM payment WHERE id = ?");
        $refreshStmt->execute([$paymentId]);
        $updated = $refreshStmt->fetch(\PDO::FETCH_ASSOC);

        return $updated ?: $payment->toArray();
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