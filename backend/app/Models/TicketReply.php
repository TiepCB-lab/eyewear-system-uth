<?php

namespace App\Models;

use Core\Model;

class TicketReply extends Model
{
    protected static string $table = 'ticketreply';

    /**
     * Reply thuộc về Ticket
     */
    public function ticket()
    {
        return Ticket::find($this->ticket_id);
    }

    /**
     * Reply thuộc về User (ai gửi)
     */
    public function user()
    {
        return User::find($this->user_id);
    }
}
