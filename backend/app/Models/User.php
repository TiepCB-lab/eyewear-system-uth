<?php

namespace App\Models;

use Core\Model;

class User extends Model
{

    protected static string $table = 'accounts';

    // Thêm danh sách các cột được phép ghi dữ liệu (Tránh lỗi Security)
    // Hãy đảm bảo các tên này khớp y hệt với cột trong bảng accounts
    protected static array $fillable = ['name', 'email', 'password', 'role', 'status'];

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