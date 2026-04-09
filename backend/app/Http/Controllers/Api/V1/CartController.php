<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\CartService;
use Exception;

class CartController
{
    private CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Lấy danh sách sản phẩm trong giỏ hàng.
     */
    public function index()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        try {
            $items = $this->cartService->getCart($userId);
            $totals = $this->cartService->getTotals($userId);

            return [
                'data' => $items,
                'totals' => $totals
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['message' => $e->getMessage()];
        }
    }

    /**
     * Thêm sản phẩm vào giỏ hàng.
     */
    public function store()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['variant_id'])) {
            http_response_code(400);
            return ['message' => 'Invalid data. variant_id is required.'];
        }

        try {
            $item = $this->cartService->addItem($userId, $data);
            return [
                'message' => 'Item added to cart',
                'data' => $item
            ];
        } catch (Exception $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        }
    }

    /**
     * Cập nhật số lượng sản phẩm.
     */
    public function update()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['cart_item_id']) || !isset($data['quantity'])) {
            http_response_code(400);
            return ['message' => 'cart_item_id and quantity are required.'];
        }

        try {
            $item = $this->cartService->updateQuantity($userId, $data['cart_item_id'], $data['quantity']);
            return [
                'message' => 'Cart updated',
                'data' => $item
            ];
        } catch (Exception $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        }
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng.
     */
    public function destroy()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        // Với Router hiện tại, chúng ta có thể cần lấy ID từ query string hoặc input
        $data = json_decode(file_get_contents('php://input'), true);
        $cartItemId = $data['cart_item_id'] ?? null;

        if (!$cartItemId) {
            http_response_code(400);
            return ['message' => 'cart_item_id is required.'];
        }

        if ($this->cartService->removeItem($userId, $cartItemId)) {
            return ['message' => 'Item removed from cart'];
        }

        http_response_code(404);
        return ['message' => 'Item not found'];
    }

    /**
     * Mock function to get current user ID from token.
     * In a real app, this would use a proper Auth middleware.
     */
    private function getCurrentUserId()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            try {
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                // Token format was userId:roleName:timestamp
                return (int) $parts[0];
            } catch (Exception $e) {
                return null;
            }
        }

        // For testing purposes, if no token is provided, return a default user ID if in local env
        // return 1; 
        return null;
    }
}
