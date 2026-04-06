<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    // 1. Khai báo tên bảng (phải khớp 100% với schema.sql của nhóm)
    protected $table = 'payment';

    // 2. Các cột được phép nhập dữ liệu (Fillable)
    protected $fillable = [
        'order_id',
        'payment_method',
        'amount',
        'status',
        'transaction_ref',
        'paid_at'
    ];

    // 3. Định nghĩa mối quan hệ: Một thanh toán thuộc về một Đơn hàng (Order)
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}