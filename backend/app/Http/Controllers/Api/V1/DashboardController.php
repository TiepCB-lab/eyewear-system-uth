<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\DashboardService;
use Core\ApiResponse;
use Throwable;

class DashboardController extends BaseController
{
	private DashboardService $dashboardService;

	public function __construct(DashboardService $dashboardService)
	{
		$this->dashboardService = $dashboardService;
	}

	public function index()
	{
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

		try {
            $data = $this->dashboardService->getSummary();
			return ApiResponse::success($data);
		} catch (Throwable $e) {
			return ApiResponse::serverError($e->getMessage());
		}
	}

	public function operations()
	{
        if (!$this->isStaff()) {
            return ApiResponse::forbidden();
        }

		try {
            $data = $this->dashboardService->getOperationsOverview();
			return ApiResponse::success($data);
		} catch (Throwable $e) {
			return ApiResponse::serverError($e->getMessage());
		}
	}
}