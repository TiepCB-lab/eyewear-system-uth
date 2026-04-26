<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\ProfileService;
use App\Http\Requests\UpdateProfileRequest;
use Core\ApiResponse;
use Exception;
use RuntimeException;

class ProfileController extends BaseController
{
    private ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function show()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $profile = $this->profileService->getProfile($userId);
            return ApiResponse::success(['profile' => $profile]);
        } catch (Exception $e) {
            return ApiResponse::error('Failed to retrieve profile: ' . $e->getMessage());
        }
    }

    public function update()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        
        $errors = UpdateProfileRequest::validate($data);
        if (!empty($errors)) {
            return ApiResponse::validationError('Validation failed', $errors);
        }

        try {
            $profile = $this->profileService->updateProfile($userId, $data);
            return ApiResponse::success(['profile' => $profile], 'Profile updated successfully');
        } catch (Exception $e) {
            return ApiResponse::error('Failed to update profile: ' . $e->getMessage());
        }
    }

    public function uploadAvatar()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
                return ApiResponse::validationError('Avatar file is required');
            }

            $file = $_FILES['avatar'];
            if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                return ApiResponse::error('Failed to upload avatar');
            }

            $maxSizeBytes = 2 * 1024 * 1024;
            if (($file['size'] ?? 0) > $maxSizeBytes) {
                return ApiResponse::validationError('Avatar must be smaller than 2MB');
            }

            $mimeType = mime_content_type($file['tmp_name']);
            $allowedTypes = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ];
            if (!isset($allowedTypes[$mimeType])) {
                return ApiResponse::validationError('Avatar must be a JPG, PNG, or WEBP image');
            }

            $uploadDir = APP_ROOT . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                throw new RuntimeException('Cannot create avatar upload directory');
            }

            $fileName = sprintf('avatar_%d_%s.%s', $userId, bin2hex(random_bytes(6)), $allowedTypes[$mimeType]);
            $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new RuntimeException('Cannot save uploaded avatar file');
            }

            $avatarPath = '/uploads/avatars/' . $fileName;
            $profile = $this->profileService->uploadAvatar($userId, $avatarPath);

            return ApiResponse::success([
                'profile' => $profile,
                'avatar' => $avatarPath,
            ], 'Avatar updated successfully');
        } catch (Exception $e) {
            return ApiResponse::error('Failed to upload avatar: ' . $e->getMessage());
        }
    }
}