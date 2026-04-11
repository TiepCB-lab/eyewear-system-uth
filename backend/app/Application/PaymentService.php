<?php

namespace App\Application;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function processPayment(Order $order, string $method, float $amount): Payment
    {
        // 1. Xác định trạng thái dựa trên phương thức
        // Thẻ hoặc Ví điện tử thì coi như xong luôn, còn lại là chờ
        $status = in_array($method, ['card', 'e_wallet']) ? 'paid' : 'pending';

        return DB::transaction(function () use ($order, $method, $amount, $status) {
            // 2. Tạo bản ghi Payment
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method' => $method,
                'amount' => $amount,
                'status' => $status,
                'transaction_ref' => Str::upper(Str::random(10)),
                'paid_at' => $status === 'paid' ? now() : null,
            ]);

            // 3. Cập nhật Order nếu đã thanh toán xong
            if ($status === 'paid') {
                $order->update([
                    'status' => 'verified', // Cập nhật thành verified theo yêu cầu
                    'payment_status' => 'paid' 
                ]);
            }

            return $payment;
        });
    }

    public function confirmPayment(Payment $payment): Payment
    {
        if ($payment->status === 'paid') {
            return $payment;
        }

        return DB::transaction(function () use ($payment) {
            // Cập nhật trạng thái Payment
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Cập nhật trạng thái Order liên quan
            if ($payment->order) {
                $payment->order->update([
                    'status' => 'verified', // Cập nhật thành verified theo yêu cầu
                    'payment_status' => 'paid'
                ]);
            }

            return $payment;
        });
    }
}