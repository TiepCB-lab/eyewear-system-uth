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

    public function show()
    {
        try {
            // TODO: Get user ID from auth middleware/token
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            $profile = $this->profileService->getProfile((int)$userId);
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
            $userId = $data['user_id'] ?? null;
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            $profile = $this->profileService->updateProfile((int)$userId, $data);
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