<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\CatalogService;

class ProductController
{
    private CatalogService $catalogService;

    public function __construct(CatalogService $catalogService)
    {
        $this->catalogService = $catalogService;
    }

    /**
     * Return paginated products with filters.
     */
    public function index(): array
    {
        return $this->catalogService->searchProducts($_GET);
    }

    /**
     * Return a single product by numeric id or slug.
     */
    public function show(): array
    {
        $identifier = $_GET['id'] ?? $_GET['slug'] ?? null;

        if ($identifier === null || $identifier === '') {
            http_response_code(400);
            return ['message' => 'id or slug is required.'];
        }

        $product = $this->catalogService->getProductDetails($identifier);

        if ($product === null) {
            http_response_code(404);
            return ['message' => 'Product not found.'];
        }

        return ['data' => $product];
    }
}