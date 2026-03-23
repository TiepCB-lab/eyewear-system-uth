<?php

namespace App\Application\Operations;

class OperationsService
{
    // TODO: [M5-OPS] getProductionQueue(): Collection -> verified orders to process
    // TODO: [M5-OPS] advanceProductionStep(int $orderId, string $step): Order
    //   Steps: lens_cutting -> frame_mounting -> qc_inspection -> packaging -> ready_to_ship
    // TODO: [M5-OPS] passQualityControl(int $orderId): Order
    // TODO: [M5-OPS] failQualityControl(int $orderId, string $reason): Order -> re-enter production
    // TODO: [M5-OPS] createShipment(int $orderId, array $shipmentData): Shipment
    // TODO: [M5-OPS] updateShipmentStatus(int $shipmentId, string $status): Shipment
    // TODO: [M5-OPS] restockPreorderItems(int $variantId, int $quantity): void -> update inventory, notify waiting customers
}
