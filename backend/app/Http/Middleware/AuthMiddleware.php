<?php

namespace App\Http\Middleware;

class AuthMiddleware
{
    public static function handle(?string $guard = null): bool
    {
        $token = self::getBearerToken();
        if ($token === null) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized', 'error' => 'Missing auth token']);
            return false;
        }

        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized', 'error' => 'Invalid auth token']);
            return false;
        }

        $parts = explode(':', $decoded, 3);
        if (count($parts) < 2 || !is_numeric($parts[0])) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized', 'error' => 'Invalid auth token']);
            return false;
        }

        $_SERVER['AUTH_TOKEN'] = $token;
        $_SERVER['AUTH_USER_ID'] = (int) $parts[0];
        $_SERVER['AUTH_USER_ROLE'] = $parts[1];
        $_SERVER['AUTH_TOKEN_GUARD'] = $guard;

        return true;
    }

    private static function getBearerToken(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($authHeader === '' || stripos($authHeader, 'Bearer ') !== 0) {
            return null;
        }

        return trim(substr($authHeader, 7));
    }
}