<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        'order_item_id',
        'od_sphere',
        'od_cylinder',
        'od_axis',
        'od_add',
        'os_sphere',
        'os_cylinder',
        'os_axis',
        'os_add',
        'pd',
    ];

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }
}
