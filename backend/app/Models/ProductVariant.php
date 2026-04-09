<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $table = 'productvariant';

    protected $fillable = [
        'product_id',
        'sku',
        'color',
        'size_code',
        'size',
        'stock_quantity',
        'image_2d_url',
        'model_3d_url',
        'additional_price',
        'price_override',
    ];

    protected $casts = [
        'stock_quantity' => 'integer',
        'additional_price' => 'decimal:2',
        'price_override' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
