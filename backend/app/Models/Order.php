<?php

namespace App\Models;

use Core\Model;

class Order extends Model
{
    protected static string $table = 'order';

    public function user()
    {
        return User::find($this->user_id);
    }

    public function items()
    {
        return OrderItem::where('order_id', $this->id);
    }

    public function shipment()
    {
        return Shipment::firstWhere('order_id', $this->id);
    }

    public function verifier()
    {
        return $this->verified_by ? User::find($this->verified_by) : null;
    }
}
