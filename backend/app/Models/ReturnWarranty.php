<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturnWarranty extends Model
{
    // TODO: [M4-SALES] Define $fillable: order_id, user_id, type, reason, status, refund_amount, resolved_at
    // TODO: [M4-SALES] type enum: return, warranty, exchange
    // TODO: [M4-SALES] Relationship: belongsTo(Order::class)
    // TODO: [M4-SALES] Relationship: belongsTo(User::class)
}
