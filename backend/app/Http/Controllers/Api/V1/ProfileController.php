<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\ProfileService;

class ProfileController
{
    private ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    private function resolveUserIdFromAuthorization(): ?int
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authHeader, 7));
        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }

        $parts = explode(':', $decoded);
        if (count($parts) < 1 || !is_numeric($parts[0])) {
            return null;
        }

        return (int)$parts[0];
    }

    public function show()
    {
        try {
            $userId = $this->resolveUserIdFromAuthorization();
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            $profile = $this->profileService->getProfile($userId);
            return ['profile' => $profile];
        } catch (\Exception $e) {
            http_response_code(400);
            return [
                'message' => 'Failed to retrieve profile',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function update()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $this->resolveUserIdFromAuthorization();
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            $profile = $this->profileService->updateProfile($userId, $data);
            return [
                'message' => 'Profile updated successfully',
                'profile' => $profile,
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return [
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ];
        }
    }
}