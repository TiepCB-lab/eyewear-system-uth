<?php

namespace App\Application;

use Core\Database;
use PDO;
use Exception;

class WishlistService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getWishlist(int $userId)
    {
        $stmt = $this->db->prepare("
            SELECT w.id as wishlist_id, p.id as product_id, p.name, p.base_price, p.brand,
                   (SELECT image_2d_url FROM productvariant WHERE product_id = p.id LIMIT 1) as thumbnail,
                   (SELECT stock_quantity FROM productvariant WHERE product_id = p.id LIMIT 1) as stock_quantity
            FROM wishlist w
            JOIN product p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function toggleItem(int $userId, int $productId)
    {
        // Check if exists
        $stmt = $this->db->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $productId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $stmt = $this->db->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$userId, $productId]);
            return ['status' => 'removed'];
        } else {
            $stmt = $this->db->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
            $stmt->execute([$userId, $productId]);
            return ['status' => 'added'];
        }
    }

    public function removeItem(int $userId, int $productId)
    {
        $stmt = $this->db->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $productId]);
        return true;
    }
}
