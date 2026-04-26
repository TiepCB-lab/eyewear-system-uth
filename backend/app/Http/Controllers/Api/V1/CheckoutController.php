<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Application\CheckoutService;
use Core\ApiResponse;
use Exception;

class CheckoutController extends BaseController
{
    private CheckoutService $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
    }

    /**
     * Process checkout.
     */
    public function store()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return ApiResponse::unauthorized();
        }

        $data = $this->getJsonInput();
        if (empty($data['shipping_address'])) {
            return ApiResponse::validationError('Shipping address is required.');
        }

        try {
            $order = $this->checkoutService->processCheckout($userId, $data);
            return ApiResponse::created($order, 'Order placed successfully');
        } catch (Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }
}

