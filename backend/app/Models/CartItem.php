<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    // TODO: [M3-SHOPPING] Define $fillable: cart_id, product_variant_id, lens_id, prescription_id, quantity, unit_price
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Cart::class)
    // TODO: [M3-SHOPPING] Relationship: belongsTo(ProductVariant::class)
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Lens::class)->nullable()
    // TODO: [M3-SHOPPING] Relationship: belongsTo(Prescription::class)->nullable()
    // TODO: [M3-SHOPPING] Accessor: getLineTotalAttribute() -> unit_price * quantity
}
