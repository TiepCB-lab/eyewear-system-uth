<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\CartService;
use Core\ApiResponse;
use Exception;

class CartController extends BaseController
{
    private CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Get items in cart.
     */
    public function index()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $items = $this->cartService->getCart($userId);
            $totals = $this->cartService->getCartTotals($userId);

            return ApiResponse::success([
                'items' => $items,
                'totals' => $totals
            ]);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Add item to cart.
     */
    public function store()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        if (empty($data['variant_id'])) {
            return ApiResponse::validationError('Variant ID is required.');
        }

        try {
            $item = $this->cartService->addItem($userId, $data);
            return ApiResponse::created($item, 'Item added to cart');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Update item quantity.
     */
    public function update($id = null)
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $cartItemId = $id ?? $data['cart_item_id'] ?? null;
        $quantity = $data['quantity'] ?? null;

        if (!$cartItemId || $quantity === null) {
            return ApiResponse::validationError('Cart item ID and quantity are required.');
        }

        try {
            $this->cartService->updateQuantity($userId, (int)$cartItemId, (int)$quantity);
            return ApiResponse::success(null, 'Quantity updated');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Toggle item selection status.
     */
    public function toggleSelection()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $cartItemId = $data['cart_item_id'] ?? null;
        $isSelected = isset($data['is_selected']) ? (bool)$data['is_selected'] : null;

        if (!$cartItemId || $isSelected === null) {
            return ApiResponse::validationError('Cart item ID and selection state are required.');
        }

        try {
            $this->cartService->toggleSelection($userId, (int)$cartItemId, $isSelected);
            return ApiResponse::success(null, 'Selection updated');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Select or deselect all items.
     */
    public function selectAll()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        $isSelected = isset($data['is_selected']) ? (bool)$data['is_selected'] : true;

        try {
            $this->cartService->selectAll($userId, $isSelected);
            return ApiResponse::success(null, $isSelected ? 'All items selected' : 'All items deselected');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Remove item from cart.
     */
    public function destroy($id = null)
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        // Với Router hiện tại, chúng ta có thể cần lấy ID từ query string hoặc input
        $data = $this->getJsonInput();
        $cartItemId = $id ?? $data['cart_item_id'] ?? null;

        if (!$cartItemId) {
            return ApiResponse::validationError('cart_item_id is required.');
        }

        if ($this->cartService->removeItem($userId, $cartItemId)) {
            return ApiResponse::success(null, 'Item removed from cart');
        }

        return ApiResponse::notFound('Item not found');
    }

    /**
     * Apply voucher.
     */
    public function applyVoucher()
    {
        $userId = $this->getUserId();
        if (!$userId) return ApiResponse::unauthorized();

        $data = $this->getJsonInput();
        $code = $data['code'] ?? null;

        if (!$code) {
            return ApiResponse::validationError('Voucher code is required.');
        }

        try {
            $promo = $this->cartService->applyVoucher($userId, $code);
            return ApiResponse::success($promo, 'Voucher applied successfully.');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Remove voucher.
     */
    public function removeVoucher()
    {
        $userId = $this->getUserId();
        if (!$userId) return ApiResponse::unauthorized();

        try {
            $this->cartService->removeVoucher($userId);
            return ApiResponse::success(null, 'Voucher removed.');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}
