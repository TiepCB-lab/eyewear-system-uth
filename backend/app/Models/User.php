<?php

namespace App\Models;

use Core\Model;

class User extends Model
{
    protected static string $table = 'user';

    public function profile()
    {
        return Profile::firstWhere('user_id', $this->id);
    }

    public function cartItems()
    {
        return CartItem::where('user_id', $this->id);
    }

    public function orders()
    {
        return Order::where('user_id', $this->id);
    }
}