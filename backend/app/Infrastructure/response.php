<?php

namespace App\Infrastructure;

class Response
{
    /**
     * Send a standardized JSON success response.
     */
    public static function json(array $data, int $statusCode = 200, string $message = 'Success'): void
    {
        http_response_code($statusCode);
        echo json_encode([
            'status'  => 'success',
            'message' => $message,
            ...$data
        ]);
        exit;
    }

    /**
     * Send a standardized JSON error response.
     */
    public static function error(string $message, int $statusCode = 400): void
    {
        http_response_code($statusCode);
        echo json_encode([
            'status'  => 'error',
            'message' => $message,
        ]);
        exit;
    }
}
