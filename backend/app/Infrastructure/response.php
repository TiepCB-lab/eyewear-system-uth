<?php

namespace App\Infrastructure;

class Response
{
    /**
     * Send a standardized JSON success response.
     */
    public static function json(mixed $data = null, int $statusCode = 200, string $message = 'Success'): void
    {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data'    => $data
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
            'success' => false,
            'message' => $message
        ]);
        exit;
    }
}
