<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\WishlistService;
use Core\ApiResponse;
use Exception;

class WishlistController extends BaseController
{
    private WishlistService $wishlistService;

    public function __construct(WishlistService $wishlistService)
    {
        $this->wishlistService = $wishlistService;
    }

    public function index()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $items = $this->wishlistService->getWishlist($userId);
            return ApiResponse::success($items);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    public function toggle()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $productId = $data['product_id'] ?? null;

        if (!$productId) {
            return ApiResponse::validationError('product_id is required.');
        }

        try {
            $result = $this->wishlistService->toggleItem($userId, (int)$productId);
            return ApiResponse::success($result, $result['message'] ?? '');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    public function destroy()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $productId = $data['product_id'] ?? null;

        if (!$productId) {
            return ApiResponse::validationError('product_id is required.');
        }

        try {
            if ($this->wishlistService->removeItem($userId, (int)$productId)) {
                return ApiResponse::success(null, 'Item removed from wishlist');
            }
            return ApiResponse::notFound('Item not found');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}
