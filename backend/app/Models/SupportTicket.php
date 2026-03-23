<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    // TODO: [M4-SALES] Define $fillable: user_id, order_id, subject, description, type, status, resolved_at
    // TODO: [M4-SALES] Define $casts: type => TicketType enum, status => TicketStatus enum
    // TODO: [M4-SALES] Relationship: belongsTo(User::class)
    // TODO: [M4-SALES] Relationship: belongsTo(Order::class)->nullable()
}
