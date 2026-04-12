<?php

namespace App\Models;

use Core\Model;

class Profile extends Model
{
    protected static string $table = 'profile';

    public function user()
    {
        return User::find($this->user_id);
    }
}