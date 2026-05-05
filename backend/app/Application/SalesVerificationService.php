<?php
namespace App\Application;

use App\Models\Order;
use App\Models\Ticket;
use Core\Database;

class SalesVerificationService
{
    /**
     * Lấy danh sách các đơn hàng đang chờ xác minh (Staff)
     */
    public function getAllOrders(array $filters = []): array
    {
        $db = Database::getInstance();
        $sql = "SELECT u.full_name AS customer_name, u.phone AS customer_phone, o.*, p.payment_method, p.status AS payment_status 
                FROM `order` o
                JOIN `user` u ON o.user_id = u.id
                LEFT JOIN payment p ON p.id = (SELECT MAX(id) FROM payment WHERE order_id = o.id)
                WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND o.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (o.order_number LIKE ? OR u.full_name LIKE ?)";
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY o.placed_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Xác minh đơn hàng hợp lệ để chuyển qua xử lý (Processing)
     */
    public function verifyOrder(int $orderId, int $staffId): array
    {
        $db = Database::getInstance();
        $orderService = new \App\Application\OrderService();
        $paymentService = new \App\Application\PaymentService();
        
        error_log("=== verifyOrder START for order $orderId ===");
        
        // Step 1: Confirm payment (payment pending → paid)
        try {
            $paymentStmt = $db->prepare("SELECT id, status FROM payment WHERE order_id = ? ORDER BY id DESC LIMIT 1");
            $paymentStmt->execute([$orderId]);
            $payment = $paymentStmt->fetch(\PDO::FETCH_ASSOC);
            
            error_log("Payment found: " . json_encode($payment));
            
            if ($payment) {
                error_log("Calling confirmPayment for payment ID: " . $payment['id']);
                $confirmResult = $paymentService->confirmPayment((int) $payment['id']);
                error_log("confirmPayment result: " . json_encode($confirmResult));
            } else {
                error_log("No payment record found for order $orderId");
                // Force-update payment status directly
                $forceUpdateStmt = $db->prepare("UPDATE payment SET status = 'paid', paid_at = NOW() WHERE order_id = ? AND status = 'pending'");
                $forceUpdateStmt->execute([$orderId]);
                error_log("Force-updated pending payments to paid");
            }
        } catch (\Exception $e) {
            error_log("Payment confirmation failed for order $orderId: " . $e->getMessage());
        }

        // Step 2: Explicitly update order status from pending → paid if needed
        $orderStmt = $db->prepare("SELECT status FROM `order` WHERE id = ?");
        $orderStmt->execute([$orderId]);
        $order = $orderStmt->fetch(\PDO::FETCH_ASSOC);
        
        error_log("Order current status: " . ($order['status'] ?? 'unknown'));
        
        if ($order && $order['status'] === 'pending') {
            $updateStmt = $db->prepare("UPDATE `order` SET status = 'paid', updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$orderId]);
            error_log("Updated order status to paid");
        }

        // Step 3: Confirm order (order paid/pending → processing)
        $orderService->confirmOrder($orderId, $staffId);
        
        error_log("=== verifyOrder COMPLETE for order $orderId ===");

        $order = Order::find($orderId);
        return $order->toArray();
    }

    /**
     * Xử lý khiếu nại từ khách hàng: đổi trả, bảo hành, hoàn tiền.
     *
     * @param int    $orderId  - ID đơn hàng liên quan
     * @param string $type     - Loại: 'exchange' | 'return' | 'refund' | 'warranty'
     * @param string $reason   - Lý do mô tả từ staff hoặc khách
     * @param int    $staffId  - Staff đang xử lý
     */
    public function processComplaint(int $orderId, string $type, string $reason, int $staffId): array
    {
        $order = Order::find($orderId);
        if (!$order) {
            throw new \Exception('Order not found');
        }

        $allowed = ['exchange', 'return', 'refund', 'warranty'];
        if (!in_array($type, $allowed, true)) {
            throw new \Exception('Invalid complaint type. Allowed: ' . implode(', ', $allowed));
        }

        // Xác định trạng thái mới dựa theo loại khiếu nại
        switch ($type) {
            case 'refund':
                $newStatus = 'refunded';
                break;
            case 'return':
            case 'exchange':
                $newStatus = 'cancelled';
                break;
            case 'warranty':
                $newStatus = 'processing'; // Đưa vào dây chuyền sửa chữa/sản xuất lại
                break;
            default:
                $newStatus = $order->status;
        }

        // Cập nhật trạng thái đơn hàng
        $order->update([
            'status'     => $newStatus,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        // Tự động tạo Support Ticket ghi nhận khiếu nại
        $subject = "[COMPLAINT] " . strtoupper($type) . " — Order #" . ($order->order_number ?? $orderId);
        $message = "Complaint type: {$type}\nReason: {$reason}\nProcessed by Staff #{$staffId} on " . date('Y-m-d H:i:s');

        $ticket = Ticket::create([
            'user_id'  => $order->user_id,
            'order_id' => $orderId,
            'subject'  => $subject,
            'message'  => $message,
            'status'   => 'in_progress',
            'priority' => 'high',
        ]);

        return [
            'order'  => $order->toArray(),
            'ticket' => $ticket->toArray(),
        ];
    }

    /**
     * Cập nhật thông số độ cận (Prescription) cho một item trong đơn hàng
     */
    public function updatePrescription(int $orderItemId, array $data): bool
    {
        $db = Database::getInstance();
        
        // Find the prescription_id for this order item
        $stmt = $db->prepare("SELECT prescription_id FROM orderitem WHERE id = ?");
        $stmt->execute([$orderItemId]);
        $item = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$item || !$item['prescription_id']) {
            throw new \Exception('Prescription not found for this item');
        }
        
        $prescriptionId = $item['prescription_id'];
        
        $fields = ['sph_od', 'sph_os', 'cyl_od', 'cyl_os', 'axis_od', 'axis_os', 'pd', 'notes'];
        $updates = [];
        $params = [];
        
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $val = trim($data[$field]);
                // Convert empty strings to null for numeric fields (but keep for notes)
                $params[] = ($val === '' && $field !== 'notes') ? null : $val;
            }
        }
        
        if (empty($updates)) return true;
        
        $params[] = $prescriptionId;
        $sql = "UPDATE prescription SET " . implode(', ', $updates) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        return $stmt->execute($params);
    }
}
