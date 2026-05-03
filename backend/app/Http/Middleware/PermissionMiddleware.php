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
            echo json_encode(\Core\ApiResponse::forbidden('You do not have permission to access this resource'));
            return false;
        }

        return true;
    }
}
