<?php

namespace App\Application\Checkout;

class CheckoutService
{
    // TODO: [M3-SHOPPING] checkout(int $userId, CheckoutDTO $dto): Order
    //   - Validate stock availability for all items
    //   - Reserve inventory (decrement)
    //   - Apply voucher if provided
    //   - Create Order, OrderItems, Payment records
    //   - Clear cart
    //   - Dispatch OrderCreated event
    // TODO: [M3-SHOPPING] initiateVnpay(Order $order): string -> return VNPay redirect URL
    // TODO: [M3-SHOPPING] handleVnpayCallback(array $params): Payment -> verify & update payment status
    // TODO: [M3-SHOPPING] cancelOrder(int $orderId, int $userId): void -> restore inventory, update status
}
