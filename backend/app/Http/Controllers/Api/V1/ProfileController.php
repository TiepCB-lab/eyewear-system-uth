<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\ProfileService;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController
{
    private ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function show(Request $request): JsonResponse
    {
        try {
            $profile = $this->profileService->getProfile($request->user());

            return response()->json([
                'profile' => new ProfileResource($profile),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve profile',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $profile = $this->profileService->updateProfile($request->user(), $request->validated());

            return response()->json([
                'message' => 'Profile updated successfully',
                'profile' => new ProfileResource($profile),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}