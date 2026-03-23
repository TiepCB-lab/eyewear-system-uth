<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    // TODO: [M3-SHOPPING] Define $fillable: order_id, product_variant_id, lens_id, prescription_id, quantity, unit_price, lens_price
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Order::class)
    // TODO: [M3-SHOPPING] Relationship: belongsTo(ProductVariant::class)
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Lens::class)->nullable()
    // TODO: [M3-SHOPPING] Accessor: getLineTotalAttribute()
}
