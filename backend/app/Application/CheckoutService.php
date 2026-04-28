<?php

namespace App\Application;

use Core\Database;
use PDO;
use Exception;

class CheckoutService
{
    private PDO $db;
    private CartService $cartService;

    public function __construct(?CartService $cartService = null)
    {
        $this->db = Database::getInstance();
        $this->cartService = $cartService ?? new CartService();
    }

    public function processCheckout(int $userId, array $checkoutData)
    {
        try {
            $this->db->beginTransaction();

            $cartItems = array_filter($this->cartService->getCart($userId), function($item) {
                return (int)$item['is_selected'] === 1;
            });
            
            if (empty($cartItems)) {
                throw new Exception("Không có sản phẩm nào được chọn để thanh toán.");
            }

            // Validate User Details (Phone)
            $stmtUser = $this->db->prepare("SELECT phone FROM `user` WHERE id = ?");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch();

            if (empty($user['phone'])) {
                // Check if profile has phone if user table doesn't
                $stmtProf = $this->db->prepare("SELECT phone FROM profiles WHERE user_id = ?");
                $stmtProf->execute([$userId]);
                $prof = $stmtProf->fetch();
                if (empty($prof['phone'])) {
                    throw new Exception("Vui lòng cập nhật số điện thoại trong trang cá nhân trước khi thanh toán.");
                }
            }

            $totals = $this->cartService->getCartTotals($userId);
            $orderNumber = 'ORD-' . strtoupper(uniqid());

            // Determine Order Type
            $orderType = 'stock';
            foreach ($cartItems as $item) {
                if (!empty($item['prescription_id']) || !empty($item['lens_id'])) {
                    $orderType = 'prescription';
                    break;
                }
            }
            // Logic for pre-order could be added here if stock check allows it

            // 1. Create Order
            $stmt = $this->db->prepare("
                INSERT INTO `order` (
                    user_id, order_number, total_amount, shipping_address, billing_address, 
                    status, order_type, placed_at
                ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
            ");
            
            $stmt->execute([
                $userId,
                $orderNumber,
                $totals['total'],
                $checkoutData['shipping_address'],
                $checkoutData['billing_address'] ?? $checkoutData['shipping_address'],
                $orderType
            ]);

            $orderId = $this->db->lastInsertId();

            // 2. Process Items
            foreach ($cartItems as $item) {
                // Reduce stock
                $this->reduceStock($item['productvariant_id'], $item['quantity']);

                // Create OrderItem
                $stmtItem = $this->db->prepare("
                    INSERT INTO orderitem (
                        order_id, productvariant_id, lens_id, prescription_id, 
                        quantity, unit_price, line_total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmtItem->execute([
                    $orderId,
                    $item['productvariant_id'],
                    $item['lens_id'],
                    $item['prescription_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['unit_price'] * $item['quantity']
                ]);
            }

            // 3. Clear Cart
            $this->clearCart($userId);

            $this->db->commit();

            return [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'total' => $totals['total']
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function reduceStock(int $variantId, int $quantity)
    {
        // Update Inventory
        $stmtInv = $this->db->prepare("UPDATE inventory SET quantity = quantity - ? WHERE productvariant_id = ? AND quantity >= ?");
        $stmtInv->execute([$quantity, $variantId, $quantity]);

        if ($stmtInv->rowCount() === 0) {
            throw new Exception("Lỗi cập nhật kho hoặc hết hàng cho variant ID: " . $variantId);
        }

        // Sync back to ProductVariant (standard redundancy in this schema)
        $stmtVar = $this->db->prepare("UPDATE productvariant SET stock_quantity = stock_quantity - ? WHERE id = ?");
        $stmtVar->execute([$quantity, $variantId]);
    }

    private function clearCart(int $userId)
    {
        $stmt = $this->db->prepare("UPDATE cart SET status = 'checked_out' WHERE user_id = ? AND status = 'active'");
        $stmt->execute([$userId]);
    }
}
