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
        $payload = file_get_contents('php://input');
        $data = json_decode($payload, true);

        if (!is_array($data) || empty($data)) {
            $data = $_POST ?: [];
        }

        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            http_response_code(422);
            return ['message' => 'Validation failed. Name, email, and password are required.'];
        }

        try {
            $user = $this->authService->register($data);
            http_response_code(201);
            $successMessage = $user['resend_verification'] ?? false
                ? 'Tài khoản đã tồn tại nhưng chưa xác thực. Email xác thực đã được gửi lại. Vui lòng kiểm tra email.'
                : 'Đăng ký thành công. Email xác thực đã được gửi. Vui lòng kiểm tra email.';
            return [
                'message' => $successMessage,
                'user' => $user,
                'verification_url' => $user['verification_url'] ?? null,
                'email_sent' => $user['email_sent'] ?? false,
                'email_error' => $user['email_error'] ?? null,
                'resend_verification' => $user['resend_verification'] ?? false,
            ];
        } catch (\Exception $e) {
            $message = $e->getMessage();
            $lowerMessage = strtolower($message);
            if (str_contains($lowerMessage, 'email already exists')) {
                http_response_code(409);
            } elseif (str_contains($lowerMessage, 'database connection') || str_contains($lowerMessage, 'not initialized')) {
                http_response_code(500);
            } else {
                http_response_code(400);
            }
            return [
                'message' => $message,
                'error' => $message
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
            $message = $e->getMessage();
            if (str_contains(strtolower($message), 'verify')) {
                http_response_code(403);
            } else {
                http_response_code(401);
            }
            return [
                'message' => $message,
                'error' => $message,
            ];
        }
    }

    public function verify()
    {
        $token = $_GET['token'] ?? null;
        $config = $this->loadConfig();
        $frontendUrl = rtrim($config['FRONTEND_URL'] ?? 'http://localhost:5500', '/');

        if (!$token) {
            header("Location: {$frontendUrl}/pages/auth/?verified=0&error=" . urlencode('Verification token is required.'));
            exit;
        }

        try {
            $email = $this->authService->verifyEmail($token);
            header("Location: {$frontendUrl}/pages/auth/?verified=1&email=" . urlencode($email));
            exit;
        } catch (\Exception $e) {
            header("Location: {$frontendUrl}/pages/auth/?verified=0&error=" . urlencode($e->getMessage()));
            exit;
        }
    }

    private function loadConfig(): array
    {
        $envPath = dirname(__DIR__, 5) . '/.env';
        if (!is_file($envPath)) return [];
        
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $config = [];
        foreach ($lines as $line) {
            if (str_contains($line, '=')) {
                [$name, $value] = explode('=', $line, 2);
                $config[trim($name)] = trim($value, " \t\n\r\0\x0B\"'");
            }
        }
        return $config;
    }

    private function getBearerToken(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        return trim(substr($authHeader, 7));
    }

    public function me()
    {
        $token = $this->getBearerToken();
        if (!$token) {
            http_response_code(401);
            return ['message' => 'Unauthorized', 'error' => 'Missing auth token'];
        }

        $userId = $this->authService->getUserIdFromToken($token);
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized', 'error' => 'Invalid auth token'];
        }

        $user = $this->authService->getUserById($userId);
        if (!$user) {
            http_response_code(401);
            return ['message' => 'Unauthorized', 'error' => 'User not found'];
        }

        return [
            'message' => 'Token check successful',
            'user' => $user,
        ];
    }

    public function logout()
    {
        return [
            'message' => 'Logged out successfully',
        ];
    }
}