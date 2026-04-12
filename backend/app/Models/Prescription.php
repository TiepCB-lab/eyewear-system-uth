<?php

namespace App\Models;

use Core\Model;

class Prescription extends Model
{
    protected static string $table = 'prescription';

    public function orderItem()
    {
        return OrderItem::find($this->orderitem_id);
    }
}
