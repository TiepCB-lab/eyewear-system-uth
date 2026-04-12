<?php

namespace App\Http\Resources;

/**
 * Transforms a Profile model/array into a standardized API response format.
 */
class ProfileResource
{
    public static function toArray($profile): array
    {
        if (is_array($profile)) {
            return [
                'id' => $profile['id'] ?? null,
                'user_id' => $profile['user_id'] ?? null,
                'phone' => $profile['phone'] ?? null,
                'address' => $profile['address'] ?? null,
                'avatar' => $profile['avatar'] ?? null,
                'birthdate' => $profile['birthdate'] ?? null,
            ];
        }

        return [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'phone' => $profile->phone,
            'address' => $profile->address,
            'avatar' => $profile->avatar,
            'birthdate' => $profile->birthdate,
        ];
    }
}