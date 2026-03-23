<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: product_id, sku, color, size, price, image_url, allow_preorder
    // TODO: [M2-CATALOG] Relationship: belongsTo(Product::class)
    // TODO: [M2-CATALOG] Relationship: hasOne(Inventory::class)
    // TODO: [M2-CATALOG] Accessor: getIsInStockAttribute() -> check inventory qty > 0
}
