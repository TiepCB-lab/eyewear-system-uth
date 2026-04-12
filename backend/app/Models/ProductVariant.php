<?php

namespace App\Models;

use Core\Model;

class ProductVariant extends Model
{
    protected static string $table = 'productvariant';

    public function product()
    {
        return Product::find($this->product_id);
    }
}
