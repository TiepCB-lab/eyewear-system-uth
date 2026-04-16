<?php

namespace App\Application;

use App\Models\Ticket;
use App\Models\TicketReply;
use Core\Database;

class SupportTicketService
{
    /**
     * Lấy danh sách ticket theo user (Customer)
     */
    public function getUserTickets(int $userId): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM supportticket WHERE user_id = ? ORDER BY updated_at DESC");
        $stmt->execute([$userId]);
        
        $tickets = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $tickets[] = $row;
        }
        return $tickets;
    }

    /**
     * Lấy tất cả các ticket cho Staff
     */
    public function getAllOpenTickets(): array
    {
        $db = Database::getInstance();
        $stmt = $db->query("SELECT * FROM supportticket WHERE status != 'closed' ORDER BY priority DESC, created_at ASC");
        
        $tickets = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $tickets[] = $row;
        }
        return $tickets;
    }

    /**
     * Lấy chi tiết ticket kèm replies
     */
    public function getTicketDetails(int $ticketId): array
    {
        $ticket = Ticket::find($ticketId);
        if (!$ticket) {
            throw new \Exception('Ticket not found');
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC");
        $stmt->execute([$ticketId]);

        $replies = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $replies[] = $row;
        }

        $ticketData = $ticket->toArray();
        $ticketData['replies'] = $replies;
        return $ticketData;
    }

    /**
     * Khách hàng tạo ticket mới
     */
    public function createTicket(int $userId, string $subject, string $message, ?int $orderId = null): array
    {
        $ticket = Ticket::create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'subject' => $subject,
            'message' => $message,
            'status' => 'open',
            'priority' => 'medium'
        ]);

        return $ticket->toArray();
    }

    /**
     * Thêm reply vào ticket
     */
    public function addReply(int $ticketId, int $userId, string $message): array
    {
        $ticket = Ticket::find($ticketId);
        if (!$ticket) {
            throw new \Exception('Ticket not found');
        }

        // Tạo reply
        $reply = TicketReply::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'message' => $message
        ]);

        // Cập nhật thời gian update của ticket và đánh dấu là in_progress nếu đang open
        $updateData = [];
        if ($ticket->status === 'open') {
            $updateData['status'] = 'in_progress';
        }
        if (!empty($updateData)) {
            $ticket->update($updateData);
        }

        return $reply->toArray();
    }
    
    /**
     * Staff Cập nhật trạng thái ticket
     */
    public function updateTicketStatus(int $ticketId, string $status): array
    {
        $ticket = Ticket::find($ticketId);
        if (!$ticket) {
            throw new \Exception('Ticket not found');
        }
        
        $ticket->update(['status' => $status]);
        return $ticket->toArray();
    }
}
