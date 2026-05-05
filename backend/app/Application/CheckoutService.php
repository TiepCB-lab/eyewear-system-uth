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

            $cartItems = array_filter($this->cartService->getCart($userId), function ($item) {
                return (int) $item['is_selected'] === 1;
            });

            if (empty($cartItems)) {
                throw new Exception("No items selected for checkout.");
            }

            $totals = $this->cartService->getCartTotals($userId);
            $orderNumber = 'ORD-' . strtoupper(uniqid());

            // 1. Xác định trạng thái đơn hàng ban đầu
            $status = 'pending';
            $orderType = 'stock';

            foreach ($cartItems as $item) {
                if (!empty($item['prescription_id']) || !empty($item['lens_id'])) {
                    $orderType = 'prescription';
                    $status = 'pending_confirmation'; // Bắt buộc nhân viên duyệt cho kính thuốc
                    break;
                }
            }

            // 2. Tạo đơn hàng
            $stmt = $this->db->prepare("
                INSERT INTO `order` (
                    user_id, order_number, total_amount, discount_amount, shipping_address, billing_address, 
                    status, order_type, promotion_id, placed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            $stmt->execute([
                $userId,
                $orderNumber,
                $totals['total'],
                $totals['discount'] ?? 0,
                $checkoutData['shipping_address'],
                $checkoutData['billing_address'] ?? $checkoutData['shipping_address'],
                $status,
                $orderType,
                $totals['promotion_id'] ?? null
            ]);

            $orderId = $this->db->lastInsertId();

            // 3. Khởi tạo bản ghi thanh toán
            $paymentMethod = $checkoutData['payment_method'] ?? 'cod';
            $stmtPayment = $this->db->prepare("
                INSERT INTO payment (order_id, payment_method, amount, status)
                VALUES (?, ?, ?, 'pending')
            ");
            $stmtPayment->execute([$orderId, $paymentMethod, $totals['total']]);

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
                'total' => $totals['total'],
                'status' => $status,
                'order_type' => $orderType
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
            throw new Exception("Error updating stock or item out of stock for variant ID: " . $variantId);
        }

        // Sync back to ProductVariant (standard redundancy in this schema)
        $stmtVar = $this->db->prepare("UPDATE productvariant SET stock_quantity = stock_quantity - ? WHERE id = ?");
        $stmtVar->execute([$quantity, $variantId]);
    }

    private function clearCart(int $userId)
    {
        // Only delete items that were selected (and thus purchased)
        $stmt = $this->db->prepare("
            DELETE ci FROM cartitem ci
            JOIN cart c ON ci.cart_id = c.id
            WHERE c.user_id = ? AND c.status = 'active' AND ci.is_selected = 1
        ");
        $stmt->execute([$userId]);
    }
}
