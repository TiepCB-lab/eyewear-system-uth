<?php

namespace App\Http\Middleware;

class RoleMiddleware
{
    public static function handle(array $allowedRoles): bool
    {
        if (empty($allowedRoles)) {
            return true;
        }

        $currentRole = $_SERVER['AUTH_USER_ROLE'] ?? null;
        if ($currentRole === null) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized', 'error' => 'Authentication is required before role checks']);
            return false;
        }

        if (!in_array($currentRole, $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden', 'error' => 'You do not have permission to access this resource']);
            return false;
        }

        return true;
    }
}