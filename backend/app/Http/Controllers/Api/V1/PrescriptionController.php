<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\PrescriptionService;
use Core\ApiResponse;
use Exception;

class PrescriptionController extends BaseController
{
    private PrescriptionService $prescriptionService;

    public function __construct(PrescriptionService $prescriptionService)
    {
        $this->prescriptionService = $prescriptionService;
    }

    public function index()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        try {
            $prescriptions = $this->prescriptionService->getUserPrescriptions($userId);
            return ApiResponse::success($prescriptions);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    public function store()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        if (!$data) {
            return ApiResponse::validationError('Invalid request payload.');
        }

        try {
            $prescriptionId = $this->prescriptionService->savePrescription($userId, $data);
            return ApiResponse::created(['prescription_id' => $prescriptionId], 'Prescription created successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}
