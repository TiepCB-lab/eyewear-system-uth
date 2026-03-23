<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: code, type, value, min_order_amount, max_uses, used_count, starts_at, expires_at, is_active
    // TODO: [M2-CATALOG] type enum: percentage, fixed_amount
    // TODO: [M2-CATALOG] Scope: scopeValid($query) -> active, not expired, uses remaining
    // TODO: [M2-CATALOG] Method: calculateDiscount(float $subtotal): float
}
