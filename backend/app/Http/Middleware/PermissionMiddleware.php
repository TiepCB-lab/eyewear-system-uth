<?php

namespace App\Http\Middleware;

use App\Models\User;

class PermissionMiddleware
{
    public static function handle(array $requiredPermissions): bool
    {
        if (empty($requiredPermissions)) {
            return true;
        }

        $userId = $_SERVER['AUTH_USER_ID'] ?? null;
        if ($userId === null) {
            echo json_encode(\Core\ApiResponse::unauthorized('Authentication is required before permission checks'));
            return false;
        }

        $hasPermission = User::hasAnyPermission((int) $userId, $requiredPermissions);

        if (!$hasPermission) {
            $userPerms = User::permissionsForUser((int) $userId);
            echo json_encode([
                'success' => false,
                'message' => 'You do not have permission to access this resource',
                'debug' => [
                    'required' => $requiredPermissions,
                    'user_has' => $userPerms
                ]
            ]);
            return false;
        }

        return true;
    }
}
