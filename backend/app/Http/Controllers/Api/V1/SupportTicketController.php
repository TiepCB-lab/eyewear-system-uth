<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\SupportTicketService;

class SupportTicketController
{
    private SupportTicketService $supportService;

    public function __construct(SupportTicketService $supportService)
    {
        $this->supportService = $supportService;
    }

    /**
     * Lấy danh sách ticket: Staff lấy tất cả open, User lấy của mình
     */
    public function index(): array
    {
        $isStaff = $_GET['role'] ?? 'user';
        $userId  = (int) ($_GET['user_id'] ?? 1); // Mock: thực tế lấy từ Auth session

        try {
            if ($isStaff === 'staff') {
                $tickets = $this->supportService->getAllOpenTickets();
            } else {
                $tickets = $this->supportService->getUserTickets($userId);
            }
            return [
                'data' => $tickets,
                'meta' => ['total' => count($tickets)],
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Lấy chi tiết 1 ticket kèm toàn bộ thread reply
     */
    public function show(): array
    {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ['error' => 'Ticket ID required'];
        }

        try {
            $ticket = $this->supportService->getTicketDetails((int) $id);
            return ['data' => $ticket];
        } catch (\Exception $e) {
            http_response_code(404);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Customer tạo ticket mới
     */
    public function store(): array
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $subject = $input['subject'] ?? '';
        $message = $input['message'] ?? '';
        $orderId = $input['order_id'] ?? null;
        $userId  = (int) ($input['user_id'] ?? 1); // Mock

        if (!$subject || !$message) {
            http_response_code(400);
            return ['error' => 'Subject and message are required'];
        }

        try {
            $ticket = $this->supportService->createTicket($userId, $subject, $message, $orderId);
            return [
                'data'    => $ticket,
                'message' => 'Ticket created successfully',
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * User hoặc Staff gửi reply vào ticket
     */
    public function reply(): array
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $ticketId = $input['ticket_id'] ?? null;
        $message  = $input['message'] ?? '';
        $userId   = (int) ($input['user_id'] ?? 1); // Mock

        if (!$ticketId || !$message) {
            http_response_code(400);
            return ['error' => 'Ticket ID and message are required'];
        }

        try {
            $reply = $this->supportService->addReply((int) $ticketId, $userId, $message);
            return [
                'data'    => $reply,
                'message' => 'Reply added successfully',
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Staff cập nhật trạng thái ticket (in_progress / resolved / closed)
     */
    public function updateStatus(): array
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $ticketId = $input['ticket_id'] ?? null;
        $status   = $input['status'] ?? null;

        $allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!$ticketId || !$status || !in_array($status, $allowed)) {
            http_response_code(400);
            return ['error' => 'ticket_id and a valid status (open|in_progress|resolved|closed) are required'];
        }

        try {
            $ticket = $this->supportService->updateTicketStatus((int) $ticketId, $status);
            return [
                'data'    => $ticket,
                'message' => "Ticket status updated to '{$status}'",
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}

