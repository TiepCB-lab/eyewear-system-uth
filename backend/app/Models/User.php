<?php

namespace App\Models;

use Core\Model;
use Core\Database;

class User extends Model
{

    protected static string $table = 'user';

    protected static array $fillable = ['full_name', 'email', 'password_hash', 'phone', 'status', 'verify_token'];

    public function roles()
    {
        $stmt = static::db()->prepare("
            SELECT r.* 
            FROM role r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
        ");
        $stmt->execute([$this->attributes['id']]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function profile()
    {
        return Profile::firstWhere('user_id', $this->attributes['id']);
    }

    public function cartItems()
    {
        return CartItem::where('user_id', $this->attributes['id']);
    }

    public function orders()
    {
        return Order::where('user_id', $this->attributes['id']);
    }
}