<?php

namespace App\Application;

use App\Models\Profile;
use App\Models\User;
use Core\Database;

class ProfileService
{
    /**
     * Lấy profile của user
     */
    public function getProfile(int $userId)
    {
        $profile = Profile::firstWhere('user_id', $userId);
        return $profile ? $profile->toArray() : null;
    }

    /**
     * Cập nhật thông tin profile
     */
    public function updateProfile(int $userId, array $data)
    {
        $profile = Profile::firstWhere('user_id', $userId);

        if (!$profile) {
            throw new \Exception('Profile not found');
        }

        $updateData = [];
        if (isset($data['phone'])) $updateData['phone'] = $data['phone'];
        if (isset($data['address'])) $updateData['address'] = $data['address'];
        if (isset($data['birthdate'])) $updateData['birthdate'] = $data['birthdate'];

        if (!empty($updateData)) {
            $profile->update($updateData);
        }

        return $profile->toArray();
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(int $userId, string $filePath)
    {
        $profile = Profile::firstWhere('user_id', $userId);

        if (!$profile) {
            throw new \Exception('Profile not found');
        }

        $profile->update(['avatar' => $filePath]);
        return $profile->toArray();
    }
}