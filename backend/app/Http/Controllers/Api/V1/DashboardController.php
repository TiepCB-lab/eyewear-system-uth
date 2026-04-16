<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\DashboardService;

class DashboardController
{
	private DashboardService $dashboardService;

	public function __construct(DashboardService $dashboardService)
	{
		$this->dashboardService = $dashboardService;
	}

	public function index(): array
	{
		try {
			return [
				'data' => $this->dashboardService->getSummary(),
			];
		} catch (\Throwable $e) {
			http_response_code(500);
			return ['message' => $e->getMessage()];
		}
	}

	public function operations(): array
	{
		try {
			return [
				'data' => $this->dashboardService->getOperationsOverview(),
			];
		} catch (\Throwable $e) {
			http_response_code(500);
			return ['message' => $e->getMessage()];
		}
	}
}