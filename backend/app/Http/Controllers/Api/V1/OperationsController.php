<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller;

class OperationsController extends Controller
{
    // TODO: [M5-OPS] GET  /api/v1/ops/queue -> productionQueue() -> orders in lab pipeline
    // TODO: [M5-OPS] PUT  /api/v1/ops/orders/{id}/step -> advanceStep(StepRequest, $id) -> move to next production step
    // TODO: [M5-OPS] POST /api/v1/ops/orders/{id}/qc-pass -> qcPass($id)
    // TODO: [M5-OPS] POST /api/v1/ops/orders/{id}/qc-fail -> qcFail(QcFailRequest, $id)
    // TODO: [M5-OPS] POST /api/v1/ops/orders/{id}/package -> package($id) -> mark ready for shipping
    // TODO: [M5-OPS] POST /api/v1/ops/orders/{id}/ship -> createShipment(ShipmentRequest, $id) -> generate tracking
    // TODO: [M5-OPS] PUT  /api/v1/ops/shipments/{id}/status -> updateShipmentStatus(StatusRequest, $id)
}
