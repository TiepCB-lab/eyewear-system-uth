<?php

use Core\Router;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LensController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\SalesController;
use App\Http\Controllers\Api\V1\SupportTicketController;

Router::get('/', [HealthController::class, 'index']);
Router::get('api/health', [HealthController::class, 'index']);

Router::group(['prefix' => 'api/v1/products'], function () {
    Router::get('/', [ProductController::class, 'index']);
    Router::get('show', [ProductController::class, 'show']);
    Router::get('categories', [CategoryController::class, 'index']);
    Router::get('lenses/available', [LensController::class, 'available']);
});

Router::group(['prefix' => 'api/v1/admin/inventory'], function () {
    Router::put('stock', [InventoryController::class, 'updateStock']);
});

// Backward-compatible aliases
Router::get('api/v1/categories', [CategoryController::class, 'index']);
Router::get('api/v1/lenses/available', [LensController::class, 'available']);

Router::group(['prefix' => 'api/auth'], function () {
    Router::post('register', [AuthController::class, 'register']);
    Router::post('login', [AuthController::class, 'login']);
    Router::post('logout', [AuthController::class, 'logout']);
    Router::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Router::group(['prefix' => 'api/profile', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [ProfileController::class, 'show']);
    Router::put('/', [ProfileController::class, 'update']);
});

Router::group(['prefix' => 'api/v1/cart'], function () {
    Router::get('/', [CartController::class, 'index']);
    Router::post('/', [CartController::class, 'store']);
    Router::put('update', [CartController::class, 'update']);
    Router::delete('delete', [CartController::class, 'destroy']);
});

// Member 3 - Checkout Routes
Router::group(['prefix' => 'api/v1/checkout'], function () {
    Router::post('/', [CheckoutController::class, 'store']);
});

// Member 4 - Sales, Payments & Support Routes
Router::group(['prefix' => 'api/v1/payments'], function () {
    Router::post('process', [PaymentController::class, 'process']);
});

Router::group(['prefix' => 'api/v1/sales'], function () {
    Router::get('pending-orders', [SalesController::class, 'pendingOrders']);
    Router::post('verify', [SalesController::class, 'verify']);
});

Router::group(['prefix' => 'api/v1/support'], function () {
    Router::get('/', [SupportTicketController::class, 'index']);
    Router::post('/', [SupportTicketController::class, 'store']);
    Router::get('show', [SupportTicketController::class, 'show']);
    Router::post('reply', [SupportTicketController::class, 'reply']);
});