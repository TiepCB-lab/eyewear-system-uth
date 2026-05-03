<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\LensService;
use Core\ApiResponse;

class LensController
{
    private LensService $lensService;

    public function __construct(LensService $lensService)
    {
        $this->lensService = $lensService;
    }

    public function available()
    {
        $variantId = isset($_GET['variant_id']) ? (int) $_GET['variant_id'] : 0;
        if ($variantId <= 0) {
            return ApiResponse::success($this->lensService->getAllLenses());
        }

        try {
            return ApiResponse::success($this->lensService->getAvailableLensesForVariant($variantId));
        } catch (\Throwable $e) {
            return ApiResponse::notFound('Failed to load available lenses: ' . $e->getMessage());
        }
    }
}
