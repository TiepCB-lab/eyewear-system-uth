<?php

namespace App\Application;

use Core\Database;

class InventoryService
{
    private const DEFAULT_LOW_STOCK_THRESHOLD = 5;

    /**
     * Bulk update stock quantities for product variants.
     *
     * $updates item format:
     * - variant_id (required)
     * - quantity (optional absolute stock)
     * - delta (optional adjustment, can be negative)
     * - reorder_level (optional low-stock threshold)
     */
    public function updateStockQuantities(int $staffUserId, array $updates): array
    {
        $this->assertStaffAccess($staffUserId);

        if (empty($updates)) {
            throw new \InvalidArgumentException('Stock update payload is empty.');
        }

        $db = Database::getInstance();
        $results = [];

        $db->beginTransaction();
        try {
            foreach ($updates as $index => $payload) {
                if (!is_array($payload)) {
                    throw new \InvalidArgumentException('Each update item must be an object/associative array.');
                }

                $results[] = $this->updateSingleVariant($db, $payload, $index);
            }

            $db->commit();
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }

        return [
            'message' => 'Stock quantities updated successfully.',
            'updated_count' => count($results),
            'updates' => $results,
        ];
    }

    /**
     * Return low-stock alerts. Uses inventory.reorder_level when available,
     * otherwise falls back to $threshold or the default threshold.
     */
    public function getLowStockAlerts(int $staffUserId, ?int $threshold = null): array
    {
        $this->assertStaffAccess($staffUserId);

        $fallbackThreshold = $threshold !== null ? max(0, $threshold) : self::DEFAULT_LOW_STOCK_THRESHOLD;

        $db = Database::getInstance();
        $sql = 'SELECT
                    pv.id AS variant_id,
                    pv.sku,
                    pv.stock_quantity,
                    p.id AS product_id,
                    p.name AS product_name,
                    i.quantity AS inventory_quantity,
                    i.reserved_quantity,
                    i.reorder_level,
                    GREATEST(COALESCE(i.quantity, pv.stock_quantity) - COALESCE(i.reserved_quantity, 0), 0) AS available_quantity,
                    COALESCE(i.reorder_level, ?) AS alert_threshold
                FROM productvariant pv
                INNER JOIN product p ON p.id = pv.product_id
                LEFT JOIN inventory i ON i.productvariant_id = pv.id
                WHERE GREATEST(COALESCE(i.quantity, pv.stock_quantity) - COALESCE(i.reserved_quantity, 0), 0) <= COALESCE(i.reorder_level, ?)
                ORDER BY available_quantity ASC, pv.id ASC';

        $stmt = $db->prepare($sql);
        $stmt->execute([$fallbackThreshold, $fallbackThreshold]);
        $rows = $stmt->fetchAll() ?: [];

        $alerts = array_map(static function (array $row): array {
            $available = (int) $row['available_quantity'];
            $thresholdValue = (int) $row['alert_threshold'];

            return [
                'variant_id' => (int) $row['variant_id'],
                'product_id' => (int) $row['product_id'],
                'product_name' => $row['product_name'],
                'sku' => $row['sku'],
                'stock_quantity' => (int) $row['stock_quantity'],
                'inventory_quantity' => $row['inventory_quantity'] !== null ? (int) $row['inventory_quantity'] : null,
                'reserved_quantity' => $row['reserved_quantity'] !== null ? (int) $row['reserved_quantity'] : 0,
                'available_quantity' => $available,
                'alert_threshold' => $thresholdValue,
                'alert_level' => $available <= 0 ? 'out_of_stock' : 'low_stock',
            ];
        }, $rows);

        return [
            'total_alerts' => count($alerts),
            'alerts' => $alerts,
        ];
    }

    private function updateSingleVariant(\PDO $db, array $payload, int $index): array
    {
        $variantId = isset($payload['variant_id']) ? (int) $payload['variant_id'] : 0;
        if ($variantId <= 0) {
            throw new \InvalidArgumentException('Invalid variant_id at updates[' . $index . '].');
        }

        $hasQuantity = array_key_exists('quantity', $payload);
        $hasDelta = array_key_exists('delta', $payload);
        if (!$hasQuantity && !$hasDelta) {
            throw new \InvalidArgumentException('Either quantity or delta is required at updates[' . $index . '].');
        }

        $variantStmt = $db->prepare('SELECT id, product_id, sku, stock_quantity FROM productvariant WHERE id = ? FOR UPDATE');
        $variantStmt->execute([$variantId]);
        $variant = $variantStmt->fetch();
        if (!$variant) {
            throw new \RuntimeException('Variant not found for id ' . $variantId . '.');
        }

        $inventoryStmt = $db->prepare('SELECT id, quantity, reserved_quantity, reorder_level FROM inventory WHERE productvariant_id = ? FOR UPDATE');
        $inventoryStmt->execute([$variantId]);
        $inventory = $inventoryStmt->fetch();

        $currentQuantity = $inventory ? (int) $inventory['quantity'] : (int) $variant['stock_quantity'];
        $newQuantity = $hasQuantity
            ? max(0, (int) $payload['quantity'])
            : max(0, $currentQuantity + (int) $payload['delta']);

        $reservedQuantity = $inventory ? (int) $inventory['reserved_quantity'] : 0;
        $newReorderLevel = array_key_exists('reorder_level', $payload)
            ? max(0, (int) $payload['reorder_level'])
            : ($inventory ? (int) $inventory['reorder_level'] : self::DEFAULT_LOW_STOCK_THRESHOLD);

        $syncVariantStmt = $db->prepare('UPDATE productvariant SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $syncVariantStmt->execute([$newQuantity, $variantId]);

        if ($inventory) {
            $inventoryUpdateStmt = $db->prepare(
                'UPDATE inventory
                 SET quantity = ?, reserved_quantity = ?, reorder_level = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE productvariant_id = ?'
            );
            $inventoryUpdateStmt->execute([$newQuantity, $reservedQuantity, $newReorderLevel, $variantId]);
        } else {
            $inventoryInsertStmt = $db->prepare(
                'INSERT INTO inventory (productvariant_id, quantity, reserved_quantity, reorder_level)
                 VALUES (?, ?, ?, ?)'
            );
            $inventoryInsertStmt->execute([$variantId, $newQuantity, $reservedQuantity, $newReorderLevel]);
        }

        $availableQuantity = max($newQuantity - $reservedQuantity, 0);
        $isLowStock = $availableQuantity <= $newReorderLevel;

        return [
            'variant_id' => $variantId,
            'sku' => $variant['sku'],
            'quantity' => $newQuantity,
            'reserved_quantity' => $reservedQuantity,
            'available_quantity' => $availableQuantity,
            'reorder_level' => $newReorderLevel,
            'is_low_stock' => $isLowStock,
            'alert_level' => $availableQuantity <= 0 ? 'out_of_stock' : ($isLowStock ? 'low_stock' : 'normal'),
        ];
    }

    private function assertStaffAccess(int $userId): void
    {
        $db = Database::getInstance();

        $stmt = $db->prepare(
            'SELECT r.name AS role_name
             FROM `user` u
             INNER JOIN role r ON r.id = u.role_id
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $roleName = strtolower((string) ($row['role_name'] ?? ''));
        if ($roleName !== 'staff') {
            throw new \RuntimeException('Forbidden. Staff role is required for inventory management.');
        }
    }
}
