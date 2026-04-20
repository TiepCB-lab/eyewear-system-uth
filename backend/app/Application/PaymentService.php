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
     * Lấy danh sách thanh toán đang chờ xác nhận (Staff)
     */
    public function pendingPayments(): array
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM payment WHERE status = 'pending' ORDER BY created_at ASC");
        
        $payments = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $payments[] = $row;
        }
        
        return $payments;
    }
}