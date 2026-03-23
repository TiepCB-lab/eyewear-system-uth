<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    // TODO: [M3-SHOPPING] Define $fillable: user_id
    // TODO: [M3-SHOPPING] Relationship: belongsTo(User::class)
    // TODO: [M3-SHOPPING] Relationship: hasMany(CartItem::class)
    // TODO: [M3-SHOPPING] Accessor: getSubtotalAttribute() -> sum of cart items
    // TODO: [M3-SHOPPING] Method: clear() -> delete all cart items
}
