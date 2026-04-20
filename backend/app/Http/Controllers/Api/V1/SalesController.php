<?php
namespace App\Http\Controllers\Api\V1;

use App\Application\SalesVerificationService;

class SalesController
{
    private SalesVerificationService $salesService;

    public function __construct(SalesVerificationService $salesService)
    {
        $this->salesService = $salesService;
    }

    /**
     * GET /api/v1/sales/pending-orders
     * Lấy danh sách đơn hàng đang chờ xác minh (Staff only)
     */
    public function pendingOrders(): array
    {
        try {
            $orders = $this->salesService->getPendingOrders();
            return [
                'data' => $orders,
                'meta' => ['total' => count($orders)],
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * POST /api/v1/sales/verify
     * Body: { order_id: int }
     * Staff xác minh đơn hàng để chuyển qua sản xuất
     */
    public function verify(): array
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $orderId = $input['order_id'] ?? null;

        // Lấy staff ID từ session/auth. Mock = 2 cho môi trường test.
        $staffId = 2;

        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'order_id is required'];
        }

        try {
            $order = $this->salesService->verifyOrder((int) $orderId, $staffId);
            return [
                'data'    => $order,
                'message' => 'Order verified and moved to production successfully',
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * POST /api/v1/sales/complaint
     * Body: { order_id: int, type: string, reason: string }
     * Staff xử lý khiếu nại: exchange | return | refund | warranty
     */
    public function complaint(): array
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $orderId = $input['order_id'] ?? null;
        $type    = $input['type']     ?? null;
        $reason  = $input['reason']   ?? '';

        // Lấy staff ID từ session/auth. Mock = 2.
        $staffId = 2;

        $allowed = ['exchange', 'return', 'refund', 'warranty'];
        if (!$orderId || !$type) {
            http_response_code(400);
            return ['error' => 'order_id and type are required'];
        }
        if (!in_array($type, $allowed, true)) {
            http_response_code(400);
            return ['error' => 'Invalid type. Allowed: ' . implode(', ', $allowed)];
        }

        try {
            $result = $this->salesService->processComplaint((int) $orderId, $type, $reason, $staffId);
            return [
                'data'    => $result,
                'message' => "Complaint ({$type}) processed successfully",
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * GET /api/v1/sales/order-complaints?order_id=xxx
     * Lấy lịch sử khiếu nại/đổi trả của một đơn hàng
     */
    public function orderComplaints(): array
    {
        $orderId = $_GET['order_id'] ?? null;
        if (!$orderId) {
            http_response_code(400);
            return ['error' => 'order_id query parameter is required'];
        }
        try {
            $complaints = $this->salesService->getOrderComplaints((int)$orderId);
            return [
                'data' => $complaints,
                'meta' => ['total' => count($complaints)],
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }
}
