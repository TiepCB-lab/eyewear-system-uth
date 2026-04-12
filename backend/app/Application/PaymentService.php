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

        // 3. Cập nhật Order nếu đã thanh toán xong
        if ($status === 'paid') {
            $order->update([
                'status' => 'verified',
                'payment_status' => 'paid'
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
        if ($order) {
            $order->update([
                'status' => 'verified',
                'payment_status' => 'paid'
            ]);
        }

        return $payment->toArray();
    }
}