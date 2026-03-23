<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    // TODO: [M3-SHOPPING] Define $fillable: user_id, address_id, type, status, subtotal, discount, total_price, voucher_code, note
    // TODO: [M3-SHOPPING] Define $casts: type => OrderType enum, status => OrderStatus enum
    // TODO: [M3-SHOPPING] Relationship: belongsTo(User::class)
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Address::class)
    // TODO: [M3-SHOPPING] Relationship: hasMany(OrderItem::class)
    // TODO: [M3-SHOPPING] Relationship: hasOne(Payment::class)
    // TODO: [M3-SHOPPING] Relationship: hasOne(Shipment::class)
    // TODO: [M4-SALES] Scope: scopePendingVerification($query)
    // TODO: [M5-OPS] Scope: scopeInProduction($query)
}
