<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    // TODO: [M1-IDENTITY] Define $fillable: name, display_name, description
    // TODO: [M1-IDENTITY] Relationship: hasMany(User::class)
    // TODO: [M1-IDENTITY] Create RoleName enum in Domain layer (admin, manager, sales, operations, customer)
}
