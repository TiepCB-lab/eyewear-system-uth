<?php
<?php

namespace App\Application;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class ProfileService
{
    /**
     * Lấy profile của user
     */
    public function getProfile(User $user)
    {
        return $user->profile;
    }

    /**
     * Cập nhật thông tin profile
     */
    public function updateProfile(User $user, array $data)
    {
        $profile = $user->profile;

        $profile->update([
            'phone' => $data['phone'] ?? $profile->phone,
            'address' => $data['address'] ?? $profile->address,
            'birthdate' => $data['birthdate'] ?? $profile->birthdate,
        ]);

        return $profile;
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(User $user, $file)
    {
        $profile = $user->profile;

        if ($profile->avatar && Storage::exists($profile->avatar)) {
            Storage::delete($profile->avatar);
        }

        $path = $file->store('avatars', 'public');
        $profile->update(['avatar' => $path]);

        return $profile;
    }
}