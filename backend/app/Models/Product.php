<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    // TODO: [M2-CATALOG] Define $fillable: category_id, name, slug, brand, description, material, shape, gender, is_active
    // TODO: [M2-CATALOG] Relationship: belongsTo(Category::class)
    // TODO: [M2-CATALOG] Relationship: hasMany(ProductVariant::class)
    // TODO: [M2-CATALOG] Relationship: hasMany(ProductImage::class)
    // TODO: [M2-CATALOG] Scope: scopeActive($query)
    // TODO: [M2-CATALOG] Scope: scopeByBrand($query, $brand) -> where('brand', $brand)
    // TODO: [M2-CATALOG] Scope: scopeByShape($query, $shape)
    // TODO: [M2-CATALOG] Scope: scopeByCategory($query, $categoryId)
    // TODO: [M2-CATALOG] Accessor: getPriceRangeAttribute() -> min/max from variants
    // TODO: [M2-CATALOG] Accessor: getPrimaryImageAttribute() -> first image or placeholder
}
