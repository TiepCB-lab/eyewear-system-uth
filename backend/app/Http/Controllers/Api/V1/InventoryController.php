<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\InventoryService;

class InventoryController
{
    private InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Update inventory stock for one or many variants.
     *
     * Accepted payload formats:
     * - {"updates": [{"variant_id": 1, "quantity": 10}]}
     * - [{"variant_id": 1, "delta": -2}]
     * - {"variant_id": 1, "quantity": 10}
     */
    public function updateStock(): array
    {
        $userId = $this->getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            return ['message' => 'Unauthorized'];
        }

        $payload = json_decode(file_get_contents('php://input'), true);
        if ($payload === null) {
            http_response_code(400);
            return ['message' => 'Invalid JSON payload.'];
        }

        $updates = $this->normalizeUpdatesPayload($payload);
        if ($updates === []) {
            http_response_code(400);
            return ['message' => 'Stock update payload is empty.'];
        }

        try {
            return $this->inventoryService->updateStockQuantities($userId, $updates);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            return ['message' => $e->getMessage()];
        } catch (\RuntimeException $e) {
            $message = $e->getMessage();

            if (stripos($message, 'forbidden') !== false) {
                http_response_code(403);
            } elseif (stripos($message, 'not found') !== false) {
                http_response_code(404);
            } else {
                http_response_code(400);
            }

            return ['message' => $message];
        } catch (\Throwable $e) {
            http_response_code(500);
            return ['message' => 'Failed to update stock.', 'error' => $e->getMessage()];
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

    private function getCurrentUserId(): ?int
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }

        try {
            $decoded = base64_decode($matches[1], true);
            if ($decoded === false) {
                return null;
            }

            $parts = explode(':', $decoded);
            if (!isset($parts[0]) || !ctype_digit((string) $parts[0])) {
                return null;
            }

            return (int) $parts[0];
        } catch (\Throwable $e) {
            return null;
        }
    }
}