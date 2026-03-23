<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    // TODO: [M3-SHOPPING] Define $fillable: order_id, method, transaction_id, amount, status, paid_at, gateway_response
    // TODO: [M3-SHOPPING] Define $casts: method => PaymentMethod enum, status => PaymentStatus enum, gateway_response => array
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Order::class)
}
