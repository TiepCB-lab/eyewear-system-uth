<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: product_variant_id, quantity, warehouse_location
    // TODO: [M2-CATALOG] Relationship: belongsTo(ProductVariant::class)
    // TODO: [M2-CATALOG] Method: reserve(int $qty) -> decrement quantity
    // TODO: [M2-CATALOG] Method: restock(int $qty) -> increment quantity
}
