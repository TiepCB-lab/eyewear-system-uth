<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    // TODO: [M5-OPS] Define $fillable: order_id, carrier, tracking_code, status, shipped_at, delivered_at
    // TODO: [M5-OPS] Define $casts: status => ShipmentStatus enum
    // TODO: [M5-OPS] Relationship: belongsTo(Order::class)
}
