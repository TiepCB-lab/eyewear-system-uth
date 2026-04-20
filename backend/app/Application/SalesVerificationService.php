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
    public function getPendingOrders(): array
    {
        // Lấy đơn hàng có status pending hoặc paid nhưng chưa được verify
        $db   = Database::getInstance();
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
            'status'          => 'processing',
            'production_step' => 'lens_cutting', // Bắt đầu dây chuyền sản xuất
            'verified_by'     => $staffId,
            'verified_at'     => date('Y-m-d H:i:s'),
        ]);

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
     * Lấy lịch sử khiếu nại/đổi trả của một đơn hàng
     */
    public function getOrderComplaints(int $orderId): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM supportticket WHERE order_id = ? AND subject LIKE '[COMPLAINT]%' ORDER BY created_at DESC");
        $stmt->execute([$orderId]);
        $complaints = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        return $complaints;
    }
}
