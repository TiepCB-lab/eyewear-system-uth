<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    // TODO: [M2-CATALOG] Define $fillable: name, slug, parent_id (nullable, self-referencing), description, image_url, sort_order
    // TODO: [M2-CATALOG] Relationship: hasMany(Product::class)
    // TODO: [M2-CATALOG] Relationship: belongsTo(Category::class, 'parent_id') -> for subcategories
    // TODO: [M2-CATALOG] Relationship: hasMany(Category::class, 'parent_id') -> children
    //
    // WHY: Need to categorize products into:
    //   - Gọng kính cận (Prescription Frames)
    //   - Kính râm (Sunglasses) -> no lens needed
    //   - Kính thời trang (Fashion) -> no prescription
    //   - Phụ kiện (Accessories) -> cases, cleaning kits
}
