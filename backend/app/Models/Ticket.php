<?php

namespace App\Models;

use Core\Model;

class Ticket extends Model
{
    protected static string $table = 'supportticket';

    public function user()
    {
        return User::find($this->user_id);
    }

    public function order()
    {
        return $this->order_id ? Order::find($this->order_id) : null;
    }

    public function replies()
    {
        return TicketReply::where('ticket_id', $this->id);
    }
}
