<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\LensService;

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
            http_response_code(400);
            return ['message' => 'variant_id is required.'];
        }

        try {
            return $this->lensService->getAvailableLensesForVariant($variantId);
        } catch (\Throwable $e) {
            http_response_code(404);
            return [
                'message' => 'Failed to load available lenses.',
                'error' => $e->getMessage(),
            ];
        }
    }
}