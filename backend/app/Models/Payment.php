<?php

namespace App\Models;

use Core\Model;

class Payment extends Model
{
    protected static string $table = 'payment';

    public function order()
    {
        return Order::find($this->order_id);
    }
}