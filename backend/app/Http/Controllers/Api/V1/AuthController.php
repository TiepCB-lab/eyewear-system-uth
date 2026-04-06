<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\AuthService;

class AuthController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            http_response_code(400);
            return ['message' => 'Validation failed. Name, email, and password are required.'];
        }

        try {
            $user = $this->authService->register($data);
            http_response_code(201);
            return [
                'message' => 'Registration successful',
                'user' => $user
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return [
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ];
        }
    }

    public function login()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            return ['message' => 'Email and password are required.'];
        }

        try {
            $result = $this->authService->login($data);
            return [
                'message' => 'Login successful',
                'user' => $result['user'],
                'token' => $result['token'],
            ];
        } catch (\Exception $e) {
            http_response_code(401);
            return [
                'message' => 'Invalid credentials',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function me()
    {
        return [
            'message' => 'Token check successful'
        ];
    }

    public function logout()
    {
        return [
            'message' => 'Logged out successfully',
        ];
    }
}