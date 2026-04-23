<?php

namespace App\Application;

use Core\Database;
use PDO;
use Exception;

class CartService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getCart(int $userId)
    {
        $stmt = $this->db->prepare("
            SELECT ci.*, pv.sku, pv.color, pv.size, pv.image_2d_url, p.name as product_name, p.base_price, 
                   pv.additional_price, l.name as lens_name, l.price as lens_price
            FROM cart c
            JOIN cartitem ci ON c.id = ci.cart_id
            JOIN productvariant pv ON ci.productvariant_id = pv.id
            JOIN product p ON pv.product_id = p.id
            LEFT JOIN lens l ON ci.lens_id = l.id
            WHERE c.user_id = ? AND c.status = 'active'
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getTotals(int $userId)
    {
        $items = $this->getCart($userId);
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += ($item['unit_price'] * $item['quantity']);
        }
        return [
            'subtotal' => $subtotal,
            'shipping' => 0, // Placeholder
            'total' => $subtotal
        ];
    }

    public function addItem(int $userId, array $data)
    {
        $variantId = $data['variant_id'];
        $quantity = $data['quantity'] ?? 1;

        // Check stock availability
        $stmt = $this->db->prepare("SELECT quantity FROM inventory WHERE productvariant_id = ?");
        $stmt->execute([$variantId]);
        $stock = $stmt->fetch();
        
        if (!$stock || $stock['quantity'] < $quantity) {
            throw new Exception("Sản phẩm không đủ số lượng trong kho.");
        }

        $cartId = $this->getOrCreateCart($userId);
        
        $lensId = $data['lens_id'] ?? null;

        // Check if item already exists in cart, then increment quantity
        $stmt = $this->db->prepare("SELECT id, quantity FROM cartitem WHERE cart_id = ? AND productvariant_id = ? AND lens_id <=> ?");
        $stmt->execute([$cartId, $variantId, $lensId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $newQty = $existing['quantity'] + $quantity;
            if ($stock['quantity'] < $newQty) throw new Exception("Không thể thêm tiếp, vượt quá tồn kho.");
            return $this->updateQuantity($userId, $existing['id'], $newQty);
        }

        // Get unit price calculation (as before)
        $stmt = $this->db->prepare("SELECT price_override, additional_price, product_id FROM productvariant WHERE id = ?");
        $stmt->execute([$variantId]);
        $variant = $stmt->fetch();

        $stmtP = $this->db->prepare("SELECT base_price FROM product WHERE id = ?");
        $stmtP->execute([$variant['product_id']]);
        $product = $stmtP->fetch();

        $unitPrice = ($variant['price_override'] ?? $product['base_price']) + $variant['additional_price'];
        
        if ($lensId) {
            $stmtL = $this->db->prepare("SELECT price FROM lens WHERE id = ?");
            $stmtL->execute([$lensId]);
            $lens = $stmtL->fetch();
            if ($lens) $unitPrice += $lens['price'];
        }

        $prescriptionId = $data['prescription_id'] ?? null;

        $stmt = $this->db->prepare("INSERT INTO cartitem (cart_id, productvariant_id, lens_id, prescription_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$cartId, $variantId, $lensId, $prescriptionId, $quantity, $unitPrice]);
        
        return $this->db->lastInsertId();
    }

    public function updateQuantity(int $userId, int $cartItemId, int $quantity)
    {
        if ($quantity <= 0) return $this->removeItem($userId, $cartItemId);

        // Check stock
        $stmt = $this->db->prepare("
            SELECT i.quantity 
            FROM cartitem ci 
            JOIN inventory i ON ci.productvariant_id = i.productvariant_id 
            WHERE ci.id = ?
        ");
        $stmt->execute([$cartItemId]);
        $stock = $stmt->fetch();

        if (!$stock || $stock['quantity'] < $quantity) {
            throw new Exception("Số lượng cập nhật vượt quá tồn kho.");
        }

        $stmt = $this->db->prepare("
            UPDATE cartitem ci
            JOIN cart c ON ci.cart_id = c.id
            SET ci.quantity = ?
            WHERE ci.id = ? AND c.user_id = ? AND c.status = 'active'
        ");
        $stmt->execute([$quantity, $cartItemId, $userId]);
        return true;
    }

    public function removeItem(int $userId, int $cartItemId)
    {
        $stmt = $this->db->prepare("
            DELETE ci FROM cartitem ci
            JOIN cart c ON ci.cart_id = c.id
            WHERE ci.id = ? AND c.user_id = ? AND c.status = 'active'
        ");
        $stmt->execute([$cartItemId, $userId]);
        return $stmt->rowCount() > 0;
    }

    private function getOrCreateCart(int $userId)
    {
        $stmt = $this->db->prepare("SELECT id FROM cart WHERE user_id = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$userId]);
        $cart = $stmt->fetch();

        if ($cart) return $cart['id'];

        $stmt = $this->db->prepare("INSERT INTO cart (user_id, status) VALUES (?, 'active')");
        $stmt->execute([$userId]);
        return $this->db->lastInsertId();
    }
}
