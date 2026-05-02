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
     * Create a new product (Manager only).
     */
    public function store()
    {
        $input = $this->getJsonInput();
        try {
            $product = $this->catalogService->createProduct($input);
            return ApiResponse::success($product, 'Product created successfully');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Update an existing product (Manager only).
     */
    public function update()
    {
        $id = $this->query('id');
        $input = $this->getJsonInput();
        
        if (!$id) return ApiResponse::validationError('Product ID is required');

        try {
            $product = $this->catalogService->updateProduct((int)$id, $input);
            return ApiResponse::success($product, 'Product updated successfully');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Deactivate a product (Manager only).
     */
    public function destroy()
    {
        $id = $this->query('id');
        if (!$id) return ApiResponse::validationError('Product ID is required');

        try {
            $this->catalogService->deleteProduct((int)$id);
            return ApiResponse::success(null, 'Product deactivated successfully');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
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