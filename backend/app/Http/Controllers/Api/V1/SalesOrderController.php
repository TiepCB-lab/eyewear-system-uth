<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller;

class SalesOrderController extends Controller
{
    // TODO: [M4-SALES] GET  /api/v1/sales/orders -> pendingOrders() -> list orders needing verification
    // TODO: [M4-SALES] GET  /api/v1/sales/orders/{id} -> showOrder($id) -> detail with prescription
    // TODO: [M4-SALES] POST /api/v1/sales/orders/{id}/verify -> verifyOrder(VerifyRequest, $id)
    // TODO: [M4-SALES] POST /api/v1/sales/orders/{id}/reject -> rejectOrder(RejectRequest, $id)
    // TODO: [M4-SALES] GET  /api/v1/sales/preorders -> listPreorders() -> pre-order queue
    // TODO: [M4-SALES] POST /api/v1/sales/preorders/{id}/fulfill -> fulfillPreorder($id)
}
