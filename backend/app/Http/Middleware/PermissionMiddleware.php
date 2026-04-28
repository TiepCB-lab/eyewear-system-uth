<?php

namespace App\Http\Middleware;

use Core\Database;

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

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT DISTINCT p.name
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = ?
        ");
        $stmt->execute([$userId]);
        $userPermissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        $hasPermission = false;
        foreach ($requiredPermissions as $permission) {
            if (in_array(trim($permission), $userPermissions, true)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            echo json_encode(\Core\ApiResponse::forbidden('You do not have permission to access this resource'));
            return false;
        }

        return true;
    }
}
