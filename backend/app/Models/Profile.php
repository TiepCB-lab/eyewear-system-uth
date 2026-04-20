<?php

namespace App\Models;

use Core\Model;

class Profile extends Model
{
    protected static string $table = 'profiles';

    public function user()
    {
        return User::find($this->user_id);
    }
}