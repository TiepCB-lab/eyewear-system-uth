<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $table = 'supportticket';

    protected $fillable = [
        'user_id',
        'order_id',
        'subject',
        'message',
        'status',
        'priority',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function replies()
    {
        return $this->hasMany(TicketReply::class, 'ticket_id');
    }
}



