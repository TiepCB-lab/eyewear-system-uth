<?php

namespace App\Http\Controllers\Api\V1;

class HealthController
{
	public function index()
	{
		return [
			'message' => 'Eyewear backend API is running.',
			'status' => 'ok',
			'timestamp' => date('c'),
		];
	}
}
