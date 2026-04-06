<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketReply extends Model
{
    // Tên bảng (đúng rồi, giữ nguyên)
    protected $table = 'ticket_replies';

    // Cho phép insert/update
    protected $fillable = [
        'ticket_id',
        'user_id',
        'message'
    ];

    /**
     * Reply thuộc về Ticket
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    /**
     * Reply thuộc về User (ai gửi)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
