<?php

namespace App\Http\Controllers\Api\V1;

use Core\ApiResponse;

class HealthController
{
	public function index()
	{
		return ApiResponse::success([
			'message' => 'Eyewear backend API is running.',
			'status' => 'ok',
			'timestamp' => date('c'),
		]);
	}
}
