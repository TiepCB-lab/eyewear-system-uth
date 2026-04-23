<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\WishlistService;
use Exception;

class WishlistController
{
    private WishlistService $wishlistService;

    public function __construct(WishlistService $wishlistService)
    {
        $this->wishlistService = $wishlistService;
    }

    public function index()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        try {
            $items = $this->wishlistService->getWishlist($userId);
            return [
                'data' => $items
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['message' => $e->getMessage()];
        }
    }

    public function toggle()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $productId = $data['product_id'] ?? null;

        if (!$productId) {
            http_response_code(400);
            return ['message' => 'product_id is required.'];
        }

        try {
            $result = $this->wishlistService->toggleItem($userId, (int)$productId);
            return $result;
        } catch (Exception $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        }
    }

    public function destroy()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $productId = $data['product_id'] ?? null;

        if (!$productId) {
            http_response_code(400);
            return ['message' => 'product_id is required.'];
        }

        if ($this->wishlistService->removeItem($userId, (int)$productId)) {
            return ['message' => 'Item removed from wishlist'];
        }

        http_response_code(404);
        return ['message' => 'Item not found'];
    }

    private function getCurrentUserId()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            try {
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                return (int) $parts[0];
            } catch (Exception $e) {
                return null;
            }
        }
        return null;
    }
}
