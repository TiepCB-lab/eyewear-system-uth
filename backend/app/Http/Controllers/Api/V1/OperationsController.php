<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\OperationsService;

class OperationsController
{
	private OperationsService $operationsService;

	public function __construct(OperationsService $operationsService)
	{
		$this->operationsService = $operationsService;
	}

	public function index(): array
	{
		try {
			return [
				'data' => $this->operationsService->listProductionQueue(),
			];
		} catch (\Throwable $e) {
			http_response_code(500);
			return ['message' => $e->getMessage()];
		}
	}

	public function advanceProduction(): array
	{
		$input = $this->getJsonInput();
		$orderId = (int) ($input['order_id'] ?? 0);

		if ($orderId <= 0) {
			http_response_code(400);
			return ['message' => 'order_id is required.'];
		}

		try {
			return [
				'message' => 'Production step advanced successfully',
				'data' => $this->operationsService->advanceProductionStep($orderId),
			];
		} catch (\Throwable $e) {
			http_response_code(400);
			return ['message' => $e->getMessage()];
		}
	}

	public function createShipment(): array
	{
		$input = $this->getJsonInput();
		$orderId = (int) ($input['order_id'] ?? 0);

		if ($orderId <= 0) {
			http_response_code(400);
			return ['message' => 'order_id is required.'];
		}

		try {
			return [
				'message' => 'Shipment created successfully',
				'data' => $this->operationsService->createShipment($orderId, $input),
			];
		} catch (\Throwable $e) {
			http_response_code(400);
			return ['message' => $e->getMessage()];
		}
	}

	public function updateShipment(): array
	{
		$input = $this->getJsonInput();
		$shipmentId = (int) ($input['shipment_id'] ?? 0);

		if ($shipmentId <= 0) {
			http_response_code(400);
			return ['message' => 'shipment_id is required.'];
		}

		try {
			return [
				'message' => 'Shipment updated successfully',
				'data' => $this->operationsService->updateShipment($shipmentId, $input),
			];
		} catch (\Throwable $e) {
			http_response_code(400);
			return ['message' => $e->getMessage()];
		}
	}

	private function getJsonInput(): array
	{
		$input = json_decode(file_get_contents('php://input'), true);
		return is_array($input) ? $input : [];
	}
}