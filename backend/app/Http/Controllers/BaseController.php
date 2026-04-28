<?php

namespace App\Http\Controllers;

use Core\ApiResponse;

/**
 * Base controller providing shared helpers for ALL API controllers.
 * Eliminates the duplicated auth/input methods across every controller.
 */
abstract class BaseController
{
    /**
     * Get the authenticated user's ID from the middleware-injected superglobal.
     * Requires 'auth:sanctum' middleware on the route.
     */
    protected function getUserId(): ?int
    {
        return isset($_SERVER['AUTH_USER_ID']) ? (int) $_SERVER['AUTH_USER_ID'] : null;
    }

    /**
     * Get the authenticated user's role from the middleware-injected superglobal.
     */
    protected function getUserRole(): ?string
    {
        return $_SERVER['AUTH_USER_ROLE'] ?? null;
    }

    /**
     * Require authentication. Returns user ID or sends 401 and returns null.
     */
    protected function requireAuth(): ?int
    {
        $userId = $this->getUserId();
        if (!$userId) {
            // Fallback: try to parse token directly (for routes without middleware)
            $userId = $this->parseTokenUserId();
        }
        return $userId;
    }

    /**
     * Parse JSON request body.
     */
    protected function getJsonInput(): array
    {
        $input = json_decode(file_get_contents('php://input'), true);
        return is_array($input) ? $input : [];
    }

    /**
     * Get a query parameter.
     */
    protected function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * Get bearer token from Authorization header.
     */
    protected function getBearerToken(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($authHeader === '' || stripos($authHeader, 'Bearer ') !== 0) {
            return null;
        }
        return trim(substr($authHeader, 7));
    }

    /**
     * Fallback: Parse user ID directly from Bearer token.
     * Used when middleware hasn't been applied to the route yet.
     */
    private function parseTokenUserId(): ?int
    {
        $token = $this->getBearerToken();
        if (!$token) {
            return null;
        }

        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }

        $parts = explode(':', $decoded);
        if (count($parts) < 1 || !is_numeric($parts[0])) {
            return null;
        }

        // Also populate the superglobals for consistency
        $_SERVER['AUTH_USER_ID'] = (int) $parts[0];
        if (isset($parts[1])) {
            $_SERVER['AUTH_USER_ROLE'] = $parts[1];
        }

        return (int) $parts[0];
    }

    /**
     * Check if the authenticated user has one of the specified permissions.
     */
    protected function hasPermission(string ...$permissions): bool
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return false;
        }

        $pdo = \Core\Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT DISTINCT p.name
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = ?
        ");
        $stmt->execute([$userId]);
        $userPermissions = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        foreach ($permissions as $permission) {
            if (in_array(trim($permission), $userPermissions, true)) {
                return true;
            }
        }
        
        return false;
    }
}
