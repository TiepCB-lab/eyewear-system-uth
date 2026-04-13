<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\CatalogService;

class CategoryController
{
    private CatalogService $catalogService;

    public function __construct(CatalogService $catalogService)
    {
        $this->catalogService = $catalogService;
    }

    /**
     * Return category list. By default only categories having active products are included.
     */
    public function index(): array
    {
        $activeOnly = $this->parseActiveOnly($_GET['active'] ?? null);
        $categories = $this->catalogService->getCategoriesList($activeOnly);

        return [
            'data' => $categories,
            'meta' => [
                'total' => count($categories),
                'active_only' => $activeOnly,
            ],
        ];
    }

    private function parseActiveOnly(mixed $value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }

        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        if (in_array($normalized, ['0', 'false', 'no', 'off', 'all'], true)) {
            return false;
        }

        return true;
    }
}
