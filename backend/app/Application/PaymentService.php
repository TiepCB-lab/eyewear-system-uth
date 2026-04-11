<?php

namespace App\Application;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentService
{
    public function processPayment(Order $order, string $method, float $amount): Payment
    {
        $status = in_array($method, ['card', 'e_wallet'], true) ? 'paid' : 'pending';
        if (in_array($method, ['bank_transfer', 'cod'], true)) {
            $status = 'pending';
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => $method,
            'amount' => $amount,
            'status' => $status,
            'transaction_ref' => Str::upper(Str::random(10)),
            'paid_at' => $status === 'paid' ? now() : null,
        ]);

        if ($status === 'paid') {
            $order->status = 'paid';
            $order->save();
        }

        return $payment;
    }

    public function confirmPayment(Payment $payment): Payment
    {
        if ($payment->status === 'paid') {
            return $payment;
        }

        $payment->status = 'paid';
        $payment->paid_at = now();
        $payment->save();

        $order = $payment->order;
        if ($order) {
            $order->status = 'paid';
            $order->save();
        }

        return $payment;
    }
}
