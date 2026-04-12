<?php

use Core\Router;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LensController;

Router::get('/', [HealthController::class, 'index']);
Router::get('api/health', [HealthController::class, 'index']);

Router::get('api/v1/products', [ProductController::class, 'index']);
Router::get('api/v1/products/show', [ProductController::class, 'show']);
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