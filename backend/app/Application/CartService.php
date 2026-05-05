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
            SELECT ci.*, pv.product_id, pv.sku, pv.color, pv.size, pv.image_2d_url, pv.stock_quantity, p.name as product_name, p.base_price, 
                   pv.additional_price, l.name as lens_name, l.price as lens_price,
                   pre.sph_od, pre.sph_os, pre.cyl_od, pre.cyl_os, pre.axis_od, pre.axis_os, pre.pd
            FROM cart c
            JOIN cartitem ci ON c.id = ci.cart_id
            JOIN productvariant pv ON ci.productvariant_id = pv.id
            JOIN product p ON pv.product_id = p.id
            LEFT JOIN lens l ON ci.lens_id = l.id
            LEFT JOIN prescription pre ON ci.prescription_id = pre.id
            WHERE c.user_id = ? AND c.status = 'active'
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getCartTotals(int $userId)
    {
        $items = $this->getCart($userId);
        $subtotal = 0;
        foreach ($items as $item) {
            if ($item['is_selected']) {
                $subtotal += ($item['unit_price'] * $item['quantity']);
            }
        }

        // Check if the cart has any applied vouchers
        $stmt = $this->db->prepare("
            SELECT p.* 
            FROM cart c
            JOIN promotion p ON c.promotion_id = p.id
            WHERE c.user_id = ? AND c.status = 'active' AND p.is_active = 1
              AND NOW() BETWEEN p.starts_at AND p.ends_at
        ");
        $stmt->execute([$userId]);
        $promo = $stmt->fetch();

        $discount = 0;
        if ($promo) {
            if ($promo['discount_type'] === 'percentage') {
                $discount = $subtotal * ($promo['discount_value'] / 100);
            } else {
                // Fixed amount discount
                $discount = $promo['discount_value'];
            }
        }

        $total = max(0, $subtotal - $discount);

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'promotion_id' => $promo ? $promo['id'] : null,
            'promotion_code' => $promo ? $promo['code'] : null,
            'shipping' => 0,
            'total' => $total
        ];
    }

    public function addItem(int $userId, array $data)
    {
        // Business logic: Prescription integration
        if (!empty($data['prescription'])) {
            $prescriptionService = new \App\Application\PrescriptionService();
            $data['prescription_id'] = $prescriptionService->savePrescription($userId, $data['prescription']);
        }

        $variantId = $data['variant_id'];
        $quantity = $data['quantity'] ?? 1;
        $isPreorder = !empty($data['is_preorder']);

        // Check stock availability (skip for pre-orders)
        $stmt = $this->db->prepare("SELECT quantity FROM inventory WHERE productvariant_id = ?");
        $stmt->execute([$variantId]);
        $stock = $stmt->fetch();
        
        if (!$isPreorder && (!$stock || $stock['quantity'] < $quantity)) {
            throw new Exception("Product out of stock or insufficient quantity.");
        }

        $cartId = $this->getOrCreateCart($userId);
        
        $lensId = $data['lens_id'] ?? null;
        $prescriptionId = $data['prescription_id'] ?? null;

        // Check if item already exists in cart, then increment quantity
        // We include prescription_id in the check so that custom prescriptions are treated as unique items
        $stmt = $this->db->prepare("SELECT id, quantity FROM cartitem WHERE cart_id = ? AND productvariant_id = ? AND lens_id <=> ? AND prescription_id <=> ?");
        $stmt->execute([$cartId, $variantId, $lensId, $prescriptionId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $newQty = $existing['quantity'] + $quantity;
            if ($stock['quantity'] < $newQty) throw new Exception("Cannot add more, exceeds available stock.");
            return $this->updateQuantity($userId, (int)$existing['id'], $newQty);
        }

        // Get unit price calculation
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
            throw new Exception("Update quantity exceeds available stock.");
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

    public function toggleSelection(int $userId, int $cartItemId, bool $selected)
    {
        $stmt = $this->db->prepare("
            UPDATE cartitem ci
            JOIN cart c ON ci.cart_id = c.id
            SET ci.is_selected = ?
            WHERE ci.id = ? AND c.user_id = ? AND c.status = 'active'
        ");
        return $stmt->execute([$selected ? 1 : 0, $cartItemId, $userId]);
    }

    public function selectAll(int $userId, bool $selected)
    {
        $stmt = $this->db->prepare("
            UPDATE cartitem ci
            JOIN cart c ON ci.cart_id = c.id
            SET ci.is_selected = ?
            WHERE c.user_id = ? AND c.status = 'active'
        ");
        return $stmt->execute([$selected ? 1 : 0, $userId]);
    }

    /**
     * Apply voucher to cart.
     */
    public function applyVoucher(int $userId, string $code)
    {
        // 1. Tìm mã giảm giá hợp lệ
        $stmt = $this->db->prepare("
            SELECT * FROM promotion 
            WHERE code = ? AND is_active = 1 AND NOW() BETWEEN starts_at AND ends_at
        ");
        $stmt->execute([$code]);
        $promo = $stmt->fetch();

        if (!$promo) {
            throw new Exception("Voucher does not exist or has expired.");
        }

        // 2. Cập nhật vào giỏ hàng của user
        $cartId = $this->getOrCreateCart($userId);
        $stmt = $this->db->prepare("UPDATE cart SET promotion_id = ? WHERE id = ?");
        $stmt->execute([$promo['id'], $cartId]);

        return $promo;
    }

    /**
     * Remove voucher.
     */
    public function removeVoucher(int $userId)
    {
        $cartId = $this->getOrCreateCart($userId);
        $stmt = $this->db->prepare("UPDATE cart SET promotion_id = NULL WHERE id = ?");
        $stmt->execute([$cartId]);
        return true;
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
