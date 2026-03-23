<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    // TODO: [M1-IDENTITY] Define $fillable: name, email, password, phone, avatar_url, role_id
    // TODO: [M1-IDENTITY] Define $hidden: password, remember_token
    // TODO: [M1-IDENTITY] Define $casts: email_verified_at => datetime, password => hashed
    // TODO: [M1-IDENTITY] Relationship: belongsTo(Role::class)
    // TODO: [M1-IDENTITY] Relationship: hasMany(Address::class)
    // TODO: [M1-IDENTITY] Relationship: hasMany(Prescription::class)
    // TODO: [M1-IDENTITY] Relationship: hasOne(Cart::class)
    // TODO: [M1-IDENTITY] Relationship: hasMany(Order::class)
    // TODO: [M1-IDENTITY] Relationship: hasMany(SupportTicket::class)
}
