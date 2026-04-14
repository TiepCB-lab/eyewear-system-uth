<?php

namespace App\Application;

use App\Models\Order;
use Core\Database;

class SalesVerificationService
{
    /**
     * Lấy danh sách các đơn hàng đang chờ xác minh
     */
    public function getPendingOrders(): array
    {
        // Giả sử status = 'pending' hoặc 'paid' nhưng chưa được verified
        // dựa theo schema.sql: status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
        // Chúng ta lấy đơn hàng có trạng thái pending hoặc paid nhưng chưa có verified_by
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM `order` WHERE verified_by IS NULL AND status IN ('pending', 'paid') ORDER BY created_at ASC");
        
        $orders = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $orders[] = $row;
        }
        
        return $orders;
    }

    /**
     * Xác minh đơn hàng hợp lệ để chuyển qua sản xuất (Operations)
     */
    public function verifyOrder(int $orderId, int $staffId): array
    {
        $order = Order::find($orderId);
        if (!$order) {
            throw new \Exception('Order not found');
        }

        if ($order->verified_by !== null) {
            throw new \Exception('Order already verified');
        }

        // Đánh dấu là staff đã verify và chuyển status sang processing
        $order->update([
            'status' => 'processing',
            'production_step' => 'lens_cutting', // Start production
            'verified_by' => $staffId,
            'verified_at' => date('Y-m-d H:i:s')
        ]);

        return $order->toArray();
    }
}
