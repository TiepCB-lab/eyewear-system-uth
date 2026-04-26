<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\CatalogService;
use Core\ApiResponse;

class ProductController extends BaseController
{
    private CatalogService $catalogService;

    public function __construct(CatalogService $catalogService)
    {
        $this->catalogService = $catalogService;
    }

    /**
     * Return paginated products with filters.
     */
    public function index()
    {
        $products = $this->catalogService->searchProducts($_GET);
        return ApiResponse::success($products);
    }

    /**
     * Return a single product by numeric id or slug.
     */
    public function show()
    {
        $identifier = $this->query('id') ?? $this->query('slug');

        if ($identifier === null || $identifier === '') {
            return ApiResponse::validationError('id or slug is required.');
        }

        $product = $this->catalogService->getProductDetails($identifier);

        if ($product === null) {
            return ApiResponse::notFound('Product not found.');
        }

        return ApiResponse::success($product);
    }

    /**
     * Return list of brands.
     */
    public function brands()
    {
        $brands = $this->catalogService->getBrandsList();
        return ApiResponse::success($brands);
    }
}