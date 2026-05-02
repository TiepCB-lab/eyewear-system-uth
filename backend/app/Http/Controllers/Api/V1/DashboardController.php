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


		try {
            $data = $this->dashboardService->getSummary();
			return ApiResponse::success($data);
		} catch (Throwable $e) {
			return ApiResponse::serverError($e->getMessage());
		}
	}

	public function operations()
	{


		try {
            $data = $this->dashboardService->getOperationsOverview();
			return ApiResponse::success($data);
		} catch (Throwable $e) {
			return ApiResponse::serverError($e->getMessage());
		}
	}

    public function salesReport()
    {
        try {
            $days = (int) ($this->query('days') ?? 30);
            $data = $this->dashboardService->getSalesByDay($days);
            return ApiResponse::success($data);
        } catch (Throwable $e) {
            return ApiResponse::serverError($e->getMessage());
        }
    }
}