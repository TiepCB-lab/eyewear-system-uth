<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\ProfileService;
use App\Http\Requests\UpdateProfileRequest;

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
            if (!is_array($data)) {
                $data = [];
            }
            $userId = $this->resolveUserIdFromAuthorization();
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            $errors = UpdateProfileRequest::validate($data);
            if (!empty($errors)) {
                http_response_code(422);
                return [
                    'message' => 'Validation failed',
                    'errors' => $errors,
                ];
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

    public function uploadAvatar()
    {
        try {
            $userId = $this->resolveUserIdFromAuthorization();
            if (!$userId) {
                http_response_code(401);
                return ['message' => 'Unauthorized'];
            }

            if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
                http_response_code(422);
                return ['message' => 'Avatar file is required'];
            }

            $file = $_FILES['avatar'];
            if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                http_response_code(400);
                return ['message' => 'Failed to upload avatar'];
            }

            $maxSizeBytes = 2 * 1024 * 1024;
            if (($file['size'] ?? 0) > $maxSizeBytes) {
                http_response_code(422);
                return ['message' => 'Avatar must be smaller than 2MB'];
            }

            $mimeType = mime_content_type($file['tmp_name']);
            $allowedTypes = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ];
            if (!isset($allowedTypes[$mimeType])) {
                http_response_code(422);
                return ['message' => 'Avatar must be a JPG, PNG, or WEBP image'];
            }

            $uploadDir = APP_ROOT . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                throw new \RuntimeException('Cannot create avatar upload directory');
            }

            $fileName = sprintf('avatar_%d_%s.%s', $userId, bin2hex(random_bytes(6)), $allowedTypes[$mimeType]);
            $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new \RuntimeException('Cannot save uploaded avatar file');
            }

            $avatarPath = '/uploads/avatars/' . $fileName;
            $profile = $this->profileService->uploadAvatar($userId, $avatarPath);

            return [
                'message' => 'Avatar updated successfully',
                'profile' => $profile,
                'avatar' => $avatarPath,
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return [
                'message' => 'Failed to upload avatar',
                'error' => $e->getMessage(),
            ];
        }
    }
}