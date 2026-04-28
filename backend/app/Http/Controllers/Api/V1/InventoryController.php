<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\InventoryService;
use Core\ApiResponse;
use Exception;

class InventoryController extends BaseController
{
    private InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get all inventory items.
     */
    public function index()
    {
        try {
            $data = $this->inventoryService->getAllInventory();
            return ApiResponse::success($data);
        } catch (Exception $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }

    /**
     * Update inventory stock for one or many variants.
     */
    public function updateStock()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized('Unauthorized or insufficient permissions');
        }

        $payload = $this->getJsonInput();
        if (empty($payload)) {
            return ApiResponse::validationError('Invalid JSON payload.');
        }

        $updates = $this->normalizeUpdatesPayload($payload);
        if ($updates === []) {
            return ApiResponse::validationError('Stock update payload is empty.');
        }

        try {
            $result = $this->inventoryService->updateStockQuantities($userId, $updates);
            return ApiResponse::success($result, 'Stock updated successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    private function normalizeUpdatesPayload(array $payload): array
    {
        if (isset($payload['updates']) && is_array($payload['updates'])) {
            return $payload['updates'];
        }

        $firstItem = reset($payload);
        if ($firstItem !== false && is_array($firstItem) && array_key_exists(0, $payload)) {
            return $payload;
        }

        if (isset($payload['variant_id'])) {
            return [$payload];
        }

        return [];
    }
}