<?php

namespace Core;

/**
 * Standardized API Response builder.
 * ALL controllers MUST use this to produce responses.
 *
 * Success: {"success": true, "data": ..., "message": "..."}
 * Error:   {"success": false, "message": "..."}
 */
class ApiResponse
{
    /**
     * Return a successful response.
     */
    public static function success($data = null, string $message = '', int $statusCode = 200): array
    {
        http_response_code($statusCode);
        $response = ['success' => true];
        if ($data !== null) {
            $response['data'] = $data;
        }
        if ($message !== '') {
            $response['message'] = $message;
        }
        return $response;
    }

    /**
     * Return a successful response with pagination metadata.
     */
    public static function paginated(array $items, int $total, int $page = 1, int $perPage = 15): array
    {
        return [
            'success' => true,
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int) ceil($total / max($perPage, 1)),
            ],
        ];
    }

    /**
     * Return a created (201) response.
     */
    public static function created($data = null, string $message = 'Created successfully'): array
    {
        return self::success($data, $message, 201);
    }

    /**
     * Return a validation error (422).
     */
    public static function validationError(string $message, array $errors = []): array
    {
        http_response_code(422);
        $response = ['success' => false, 'message' => $message];
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        return $response;
    }

    /**
     * Return an unauthorized error (401).
     */
    public static function unauthorized(string $message = 'Unauthorized'): array
    {
        http_response_code(401);
        return ['success' => false, 'message' => $message];
    }

    /**
     * Return a forbidden error (403).
     */
    public static function forbidden(string $message = 'Forbidden'): array
    {
        http_response_code(403);
        return ['success' => false, 'message' => $message];
    }

    /**
     * Return a not-found error (404).
     */
    public static function notFound(string $message = 'Resource not found'): array
    {
        http_response_code(404);
        return ['success' => false, 'message' => $message];
    }

    /**
     * Return a generic client error (400).
     */
    public static function error(string $message, int $statusCode = 400): array
    {
        http_response_code($statusCode);
        return ['success' => false, 'message' => $message];
    }

    /**
     * Return a server error (500).
     */
    public static function serverError(string $message = 'Internal server error'): array
    {
        http_response_code(500);
        return ['success' => false, 'message' => $message];
    }
}
