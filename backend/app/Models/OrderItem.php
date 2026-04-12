<?php

namespace App\Models;

use Core\Model;

class OrderItem extends Model
{
    protected static string $table = 'orderitem';

    public function order()
    {
        return Order::find($this->order_id);
    }

    public function variant()
    {
        return ProductVariant::find($this->productvariant_id);
    }

    public function prescription()
    {
        return Prescription::firstWhere('orderitem_id', $this->id);
    }
}
