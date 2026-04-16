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

    public function index(): array
    {
        $isStaff = $_GET['role'] ?? 'user'; // Giả lập auth
        $userId = 1; // Giả lập user customer ID

        try {
            if ($isStaff === 'staff') {
                $tickets = $this->supportService->getAllOpenTickets();
            } else {
                $tickets = $this->supportService->getUserTickets($userId);
            }
            return [
                'data' => $tickets,
                'meta' => ['total' => count($tickets)]
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }
    
    public function show(): array
    {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            return ['error' => 'Ticket ID required'];
        }
        
        try {
            $ticket = $this->supportService->getTicketDetails($id);
            return ['data' => $ticket];
        } catch (\Exception $e) {
            http_response_code(404);
            return ['error' => $e->getMessage()];
        }
    }

    public function store(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subject = $input['subject'] ?? '';
        $message = $input['message'] ?? '';
        $userId = 1; // Giả lập userId

        if (!$subject || !$message) {
            http_response_code(400);
            return ['error' => 'Subject and message are required'];
        }

        try {
            $ticket = $this->supportService->createTicket($userId, $subject, $message);
            return [
                'data' => $ticket,
                'message' => 'Ticket created successfully'
            ];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    public function reply(): array
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $ticketId = $input['ticket_id'] ?? null;
        $message = $input['message'] ?? '';
        $userId = 1; // Mock

        if (!$ticketId || !$message) {
            http_response_code(400);
            return ['error' => 'Ticket ID and message are required'];
        }

        try {
            $reply = $this->supportService->addReply($ticketId, $userId, $message);
            return [
                'data' => $reply,
                'message' => 'Reply added successfully'
            ];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
