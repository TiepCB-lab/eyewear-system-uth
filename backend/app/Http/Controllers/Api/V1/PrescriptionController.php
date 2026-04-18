<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\PrescriptionService;
use Exception;

class PrescriptionController
{
    private PrescriptionService $prescriptionService;

    public function __construct(PrescriptionService $prescriptionService)
    {
        $this->prescriptionService = $prescriptionService;
    }

    public function index()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        try {
            $prescriptions = $this->prescriptionService->getUserPrescriptions($userId);
            return [
                'message' => 'success',
                'data' => $prescriptions
            ];
        } catch (Exception $e) {
            http_response_code(500);
            return ['message' => $e->getMessage()];
        }
    }

    public function store()
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            return ['message' => 'Invalid data.'];
        }

        try {
            $prescriptionId = $this->prescriptionService->savePrescription($userId, $data);
            return [
                'message' => 'Prescription created successfully',
                'data' => ['prescription_id' => $prescriptionId]
            ];
        } catch (Exception $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        }
    }

    /**
     * Mock function to get current user ID from token.
     * In a real app, this would use a proper Auth middleware.
     */
    private function getCurrentUserId()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            try {
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                // Token format was userId:roleName:timestamp
                return (int) $parts[0];
            } catch (Exception $e) {
                return null;
            }
        }

        return null;
    }
}
