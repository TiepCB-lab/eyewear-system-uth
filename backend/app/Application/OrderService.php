<?php

namespace App\Application;

use Core\Database;

class OrderService
{
    private const ORDER_WORKFLOW = [
        'pending'    => ['confirmed', 'cancelled'],
        'confirmed'  => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped'    => ['completed'],
        'completed'  => [],
        'cancelled'  => []
    ];

    public function transitionStatus(int $orderId, string $newStatus, int $staffId): bool
    {
        $db = Database::getInstance();
        
        // 1. Get current status
        $stmt = $db->prepare("SELECT status FROM `order` WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$order) {
            throw new \Exception("Order not found.");
        }

        $currentStatus = $order['status'];

        // 2. Validate transition
        if (!isset(self::ORDER_WORKFLOW[$currentStatus]) || !in_array($newStatus, self::ORDER_WORKFLOW[$currentStatus])) {
            throw new \Exception("Invalid status transition from $currentStatus to $newStatus.");
        }

        // 3. Update status
        $stmtUpdate = $db->prepare("
            UPDATE `order` 
            SET status = ?, 
                updated_at = NOW() 
            WHERE id = ?
        ");
        
        return $stmtUpdate->execute([$newStatus, $orderId]);
    }

    public function confirmOrder(int $orderId, int $staffId): bool
    {
        $db = Database::getInstance();
        
        // Specific logic for confirmation (can include verification by staff)
        $this->transitionStatus($orderId, 'confirmed', $staffId);

        $stmt = $db->prepare("
            UPDATE `order` 
            SET verified_by = ?, 
                verified_at = NOW() 
            WHERE id = ?
        ");
        return $stmt->execute([$staffId, $orderId]);
    }

    public function getOrdersForUser(int $userId): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT o.id, o.order_number, o.status, o.total_amount, o.placed_at, o.production_step,
                    COALESCE(p.status, o.status) AS payment_status
             FROM `order` o
             LEFT JOIN payment p ON p.order_id = o.id
             WHERE o.user_id = ?
             ORDER BY o.placed_at DESC'
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
    }

    public function getOrderDetailForUser(int $userId, int $orderId): ?array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT o.id, o.order_number, o.status, o.total_amount, o.shipping_address, o.billing_address,
                    o.order_type, o.placed_at, o.production_step, o.verified_by, o.verified_at,
                    COALESCE(p.status, o.status) AS payment_status,
                    p.payment_method, p.amount AS payment_amount, p.transaction_ref, p.paid_at
             FROM `order` o
             LEFT JOIN payment p ON p.order_id = o.id
             WHERE o.id = ? AND o.user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$orderId, $userId]);
        $order = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$order) {
            return null;
        }

        $itemsStmt = $db->prepare(
            'SELECT oi.id, oi.quantity, oi.unit_price, oi.line_total,
                    pv.id AS productvariant_id, pv.sku, pv.color, pv.size, pv.image_2d_url,
                    p.id AS product_id, p.name AS product_name, p.brand
             FROM orderitem oi
             LEFT JOIN productvariant pv ON pv.id = oi.productvariant_id
             LEFT JOIN product p ON p.id = pv.product_id
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC'
        );
        $itemsStmt->execute([$orderId]);
        $order['items'] = $itemsStmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return $order;
    }
}
