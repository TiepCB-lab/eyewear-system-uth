<?php

namespace App\Models;

use Core\Model;

class CartItem extends Model
{
    protected static string $table = 'cartitem';

    public function user()
    {
        return User::find($this->user_id);
    }

    public function variant()
    {
        return ProductVariant::find($this->productvariant_id);
    }

    public function lens()
    {
        return $this->lens_id ? Lens::find($this->lens_id) : null;
    }
}
