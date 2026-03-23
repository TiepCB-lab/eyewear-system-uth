<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    // TODO: [M1-IDENTITY] Define $fillable: user_id, label, recipient_name, phone, street, ward, district, city, is_default
    // TODO: [M1-IDENTITY] Relationship: belongsTo(User::class)
    // TODO: [M1-IDENTITY] Scope: scopeDefault($query) to get default address
}
