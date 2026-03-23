<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: product_id, product_variant_id (nullable), image_url, sort_order, is_primary
    // TODO: [M2-CATALOG] Relationship: belongsTo(Product::class)
    // TODO: [M2-CATALOG] Relationship: belongsTo(ProductVariant::class)->nullable()
    // WHY: A product needs MULTIPLE images (gallery), not just one image_url on variant.
    //       Some images are for the product overall, some are variant-specific (e.g. different color).
}
