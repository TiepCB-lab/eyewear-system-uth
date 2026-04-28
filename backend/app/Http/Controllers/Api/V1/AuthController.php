<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\AuthService;
use Core\ApiResponse;
use Exception;

class AuthController extends BaseController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register()
    {
        $data = $this->getJsonInput();
        if (empty($data)) {
            $data = $_POST ?: [];
        }

        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            return ApiResponse::validationError('Name, email, and password are required.');
        }

        try {
            $user = $this->authService->register($data);
            $successMessage = ($user['resend_verification'] ?? false)
                ? 'This account already exists but is not verified. A verification email has been resent.'
                : 'Registration successful. A verification email has been sent.';
            
            return ApiResponse::created([
                'user' => $user,
                'verification_url' => $user['verification_url'] ?? null,
                'email_sent' => $user['email_sent'] ?? false
            ], $successMessage);
        } catch (Exception $e) {
            $message = $e->getMessage();
            $lowerMessage = strtolower($message);
            if (str_contains($lowerMessage, 'already exists') || str_contains($lowerMessage, 'duplicate entry')) {
                return ApiResponse::error('This email is already registered.', 409);
            }
            return ApiResponse::error($message);
        }
    }

    public function login()
    {
        $data = $this->getJsonInput();
        if (empty($data['email']) || empty($data['password'])) {
            return ApiResponse::validationError('Email and password are required.');
        }

        try {
            $result = $this->authService->login($data);
            return ApiResponse::success([
                'user' => $result['user'],
                'token' => $result['token'],
            ], 'Login successful');
        } catch (Exception $e) {
            $message = $e->getMessage();
            if (str_contains(strtolower($message), 'verify')) {
                return ApiResponse::forbidden($message);
            }
            return ApiResponse::unauthorized($message);
        }
    }

    public function verify()
    {
        $token = $this->query('token');
        
        // This is a special case where we might need to redirect
        $expectsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

        if (!$token) {
            if ($expectsJson) return ApiResponse::validationError('Verification token is required.');
            $this->redirectToFrontend('/pages/auth/?verified=0&error=' . urlencode('Verification token is required.'));
            return;
        }

        try {
            $email = $this->authService->verifyEmail($token);
            if ($expectsJson) {
                return ApiResponse::success(['email' => $email], 'Email verified successfully.');
            }
            $this->redirectToFrontend('/pages/auth/?verified=1&email=' . urlencode($email));
        } catch (Exception $e) {
            if ($expectsJson) {
                return ApiResponse::validationError($e->getMessage());
            }
            $this->redirectToFrontend('/pages/auth/?verified=0&error=' . urlencode($e->getMessage()));
        }
    }

    public function forgotPassword()
    {
        $data = $this->getJsonInput();
        $email = trim((string)($data['email'] ?? ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ApiResponse::validationError('Invalid email address.');
        }

        try {
            $result = $this->authService->requestPasswordReset($email);
            return ApiResponse::success($result, 'Password reset instructions sent.');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    public function resetPassword()
    {
        $data = $this->getJsonInput();
        if (empty($data)) {
            return ApiResponse::validationError('Invalid request payload.');
        }

        try {
            $this->authService->resetPassword($data);
            return ApiResponse::success(null, 'Password reset successful. You can sign in now.');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    public function me()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $user = $this->authService->getCurrentUser();
            if (!$user) {
                return ApiResponse::unauthorized('User not found');
            }
            return ApiResponse::success(['user' => $user]);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    public function logout()
    {
        $token = $this->getBearerToken();
        if ($token) {
            $this->authService->logout($token);
        }
        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function changePassword()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            return ApiResponse::validationError('Current and new password are required.');
        }

        if ($newPassword !== $confirmPassword) {
            return ApiResponse::validationError('Passwords do not match.');
        }

        try {
            $this->authService->changePassword($userId, $currentPassword, $newPassword);
            return ApiResponse::success(null, 'Password changed successfully.');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    private function redirectToFrontend(string $path)
    {
        $frontendUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:5500', '/');
        header("Location: {$frontendUrl}{$path}");
        exit;
    }
}