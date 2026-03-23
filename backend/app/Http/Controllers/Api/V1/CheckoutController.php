<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller;

class CheckoutController extends Controller
{
    // TODO: [M3-SHOPPING] POST /api/v1/checkout -> checkout(CheckoutRequest) -> create order from cart
    // TODO: [M3-SHOPPING] POST /api/v1/checkout/vnpay -> initiateVnpay(VnpayRequest) -> redirect to VNPay
    // TODO: [M3-SHOPPING] GET  /api/v1/checkout/vnpay/callback -> vnpayCallback(Request) -> handle VNPay return
    // TODO: [M3-SHOPPING] GET  /api/v1/orders -> listOrders() -> customer order history
    // TODO: [M3-SHOPPING] GET  /api/v1/orders/{id} -> showOrder($id) -> order detail with items, payment, shipment
    // TODO: [M3-SHOPPING] POST /api/v1/orders/{id}/cancel -> cancelOrder($id)
}
