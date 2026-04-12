<?php

namespace App\Http\Resources;

/**
 * Transforms a User model/array into a standardized API response format.
 */
class UserResource
{
    public static function toArray($user): array
    {
        if (is_array($user)) {
            return [
                'id' => $user['id'] ?? null,
                'name' => $user['full_name'] ?? $user['name'] ?? null,
                'email' => $user['email'] ?? null,
                'role' => $user['role_name'] ?? $user['role'] ?? null,
                'created_at' => $user['created_at'] ?? null,
            ];
        }

        // If it's a Model object
        return [
            'id' => $user->id,
            'name' => $user->full_name ?? $user->name,
            'email' => $user->email,
            'role' => $user->role_name ?? $user->role,
            'created_at' => $user->created_at,
        ];
    }
}