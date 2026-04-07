<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'variant_id',
        'lens_id',
        'quantity',
        'unit_price',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function lens()
    {
        return $this->belongsTo(Lens::class, 'lens_id');
    }

    public function prescription()
    {
        return $this->hasOne(Prescription::class);
    }
}
