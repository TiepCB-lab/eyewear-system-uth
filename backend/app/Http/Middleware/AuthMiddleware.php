<?php

namespace App\Http\Middleware;

class AuthMiddleware
{
    public static function handle(?string $guard = null): bool
    {
        $token = self::getBearerToken();
        if ($token === null) {
            echo json_encode(\Core\ApiResponse::unauthorized('Missing auth token'));
            return false;
        }

        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            echo json_encode(\Core\ApiResponse::unauthorized('Invalid auth token'));
            return false;
        }

        $parts = explode(':', $decoded, 3);
        if (count($parts) < 2 || !is_numeric($parts[0])) {
            echo json_encode(\Core\ApiResponse::unauthorized('Invalid auth token'));
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