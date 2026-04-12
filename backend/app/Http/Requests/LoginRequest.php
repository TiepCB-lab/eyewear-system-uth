<?php

namespace App\Http\Requests;

/**
 * Validation rules for login requests.
 * Used as a reference for manual validation in controllers.
 */
class LoginRequest
{
    public static function rules(): array
    {
        return [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ];
    }

    /**
     * Validate input data against rules.
     * Returns array of errors (empty if valid).
     */
    public static function validate(array $data): array
    {
        $errors = [];

        if (empty($data['email'])) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email must be a valid email address';
        }

        if (empty($data['password'])) {
            $errors['password'] = 'Password is required';
        } elseif (strlen($data['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }

        return $errors;
    }
}