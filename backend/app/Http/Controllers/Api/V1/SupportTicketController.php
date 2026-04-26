<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\SupportTicketService;
use Core\ApiResponse;
use Exception;

class SupportTicketController extends BaseController
{
    private SupportTicketService $supportService;

    public function __construct(SupportTicketService $supportService)
    {
        $this->supportService = $supportService;
    }

    /**
     * Get ticket list.
     */
    public function index()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            if ($this->isStaff()) {
                $tickets = $this->supportService->getAllOpenTickets();
            } else {
                $tickets = $this->supportService->getUserTickets($userId);
            }
            return ApiResponse::success($tickets);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Get ticket details.
     */
    public function show()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $id = $this->query('id');
        if (!$id) {
            return ApiResponse::validationError('Ticket ID required');
        }

        try {
            $ticket = $this->supportService->getTicketDetails((int) $id);
            // Security check: Only staff or ticket owner can see details
            if (!$this->isStaff() && $ticket['user_id'] != $userId) {
                return ApiResponse::forbidden();
            }
            return ApiResponse::success($ticket);
        } catch (Exception $e) {
            return ApiResponse::notFound($e->getMessage());
        }
    }

    /**
     * Create new ticket.
     */
    public function store()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $input   = $this->getJsonInput();
        $subject = $input['subject'] ?? '';
        $message = $input['message'] ?? '';
        $orderId = $input['order_id'] ?? null;

        if (!$subject || !$message) {
            return ApiResponse::validationError('Subject and message are required');
        }

        try {
            $ticket = $this->supportService->createTicket($userId, $subject, $message, $orderId);
            return ApiResponse::created($ticket, 'Ticket created successfully');
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Add reply to ticket.
     */
    public function reply()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $input    = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;
        $message  = $input['message'] ?? '';
        $isStaff  = $this->isStaff();

        if (!$ticketId || !$message) {
            return ApiResponse::validationError('Ticket ID and message are required');
        }

        try {
            $reply = $this->supportService->addReply((int) $ticketId, $userId, $message, $isStaff);
            return ApiResponse::success($reply, 'Reply added successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Update ticket status (Staff only).
     */
    public function updateStatus()
    {
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

        $input    = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;
        $status   = $input['status'] ?? null;

        $allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!$ticketId || !$status || !in_array($status, $allowed)) {
            return ApiResponse::validationError('ticket_id and a valid status are required');
        }

        try {
            $ticket = $this->supportService->updateTicketStatus((int) $ticketId, $status);
            return ApiResponse::success($ticket, "Ticket status updated to '{$status}'");
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * Delete ticket (Staff only).
     */
    public function delete()
    {
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

        $input    = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;

        if (!$ticketId) {
            return ApiResponse::validationError('ticket_id is required');
        }

        try {
            $this->supportService->deleteTicket((int)$ticketId, true);
            return ApiResponse::success(null, 'Ticket deleted successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}
