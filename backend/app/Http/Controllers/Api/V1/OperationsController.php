<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\OperationsService;
use Core\ApiResponse;
use Throwable;

class OperationsController extends BaseController
{
	private OperationsService $operationsService;

	public function __construct(OperationsService $operationsService)
	{
		$this->operationsService = $operationsService;
	}

	public function index()
	{


		try {
            $data = $this->operationsService->listProductionQueue();
			return ApiResponse::success($data);
		} catch (Throwable $e) {
			return ApiResponse::serverError($e->getMessage());
		}
	}

	public function advanceProduction()
	{


		$input = $this->getJsonInput();
		$orderId = (int) ($input['order_id'] ?? 0);

		if ($orderId <= 0) {
			return ApiResponse::validationError('order_id is required.');
		}

		try {
            $data = $this->operationsService->advanceProductionStep($orderId);
			return ApiResponse::success($data, 'Production step advanced successfully');
		} catch (Throwable $e) {
			return ApiResponse::error($e->getMessage());
		}
	}

	public function createShipment()
	{


		$input = $this->getJsonInput();
		$orderId = (int) ($input['order_id'] ?? 0);

		if ($orderId <= 0) {
			return ApiResponse::validationError('order_id is required.');
		}

		try {
            $data = $this->operationsService->createShipment($orderId, $input);
			return ApiResponse::success($data, 'Shipment created successfully');
		} catch (Throwable $e) {
			return ApiResponse::error($e->getMessage());
		}
	}

	public function updateShipment()
	{


		$input = $this->getJsonInput();
		$shipmentId = (int) ($input['shipment_id'] ?? 0);

		if ($shipmentId <= 0) {
			return ApiResponse::validationError('shipment_id is required.');
		}

		try {
            $data = $this->operationsService->updateShipment($shipmentId, $input);
			return ApiResponse::success($data, 'Shipment updated successfully');
		} catch (Throwable $e) {
			return ApiResponse::error($e->getMessage());
		}
	}
}