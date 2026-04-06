<?php

use Core\Router;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;

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