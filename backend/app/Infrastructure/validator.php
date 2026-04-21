<?php

namespace App\Infrastructure;

class Validator
{
    /**
     * Validate that all required keys exist and are not empty.
     * Returns the name of the missing key, or null if all exist.
     */
    public static function requireKeys(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            if (!isset($payload[$key])) {
                return $key;
            }
            // Check for empty string if it's a string
            if (is_string($payload[$key]) && trim($payload[$key]) === '') {
                return $key;
            }
        }
        return null;
    }

    /**
     * Validate email format
     */
    public static function isEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
