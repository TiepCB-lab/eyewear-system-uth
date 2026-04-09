<?php

namespace App\Application\Shopping;

use App\Models\CartItem;
use App\Models\ProductVariant;
use Exception;

class CartService
{
    /**
     * Get all cart items for a specific user.
     */
    public function getCart(int $userId)
    {
        return CartItem::with(['variant.product', 'lens'])
            ->where('user_id', $userId)
            ->get();
    }

    /**
     * Add an item to the user's cart.
     */
    public function addItem(int $userId, array $data)
    {
        $variantId = $data['variant_id'];
        $lensId = $data['lens_id'] ?? null;
        $quantity = $data['quantity'] ?? 1;

        // 1. Validate variant existence and stock
        $variant = ProductVariant::find($variantId);
        if (!$variant) {
            throw new Exception("Product variant not found.");
        }

        // Placeholder for stock check (Member 2 task)
        // if ($variant->stock_quantity < $quantity) {
        //     throw new Exception("Not enough stock available.");
        // }

        // 2. Check if this exact item (variant + lens combination) already exists in cart
        $existingItem = CartItem::where('user_id', $userId)
            ->where('variant_id', $variantId)
            ->where('lens_id', $lensId)
            ->first();

        if ($existingItem) {
            $existingItem->quantity += $quantity;
            $existingItem->save();
            return $existingItem;
        }

        // 3. Create new cart item
        return CartItem::create([
            'user_id' => $userId,
            'variant_id' => $variantId,
            'lens_id' => $lensId,
            'quantity' => $quantity
        ]);
    }

    /**
     * Update the quantity of a specific cart item.
     */
    public function updateQuantity(int $userId, int $cartItemId, int $quantity)
    {
        $cartItem = CartItem::where('user_id', $userId)->find($cartItemId);

        if (!$cartItem) {
            throw new Exception("Cart item not found.");
        }

        if ($quantity <= 0) {
            return $this->removeItem($userId, $cartItemId);
        }

        $cartItem->quantity = $quantity;
        $cartItem->save();

        return $cartItem;
    }

    /**
     * Remove a specific item from the cart.
     */
    public function removeItem(int $userId, int $cartItemId)
    {
        $cartItem = CartItem::where('user_id', $userId)->find($cartItemId);

        if ($cartItem) {
            return $cartItem->delete();
        }

        return false;
    }

    /**
     * Clear the entire cart for a user.
     */
    public function clearCart(int $userId)
    {
        return CartItem::where('user_id', $userId)->delete();
    }

    /**
     * Calculate cart totals (subtotal).
     */
    public function getTotals(int $userId)
    {
        $items = $this->getCart($userId);
        $subtotal = 0;

        foreach ($items as $item) {
            // Price = variant price + lens price (if any)
            $itemPrice = ($item->variant->price_override ?? $item->variant->product->base_price + $item->variant->additional_price);
            if ($item->lens) {
                $itemPrice += $item->lens->price;
            }
            
            $subtotal += $itemPrice * $item->quantity;
        }

        return [
            'subtotal' => $subtotal,
            'item_count' => $items->sum('quantity')
        ];
    }
}
