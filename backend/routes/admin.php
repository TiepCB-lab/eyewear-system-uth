<?php

// TODO: Register admin, sales, operations, and dashboard routes.
// Suggested groups:
// - /api/admin/products
// - /api/admin/vouchers
// - /api/admin/staff
// - /api/sales/orders
// - /api/operations/orders
// - /api/dashboard

$router->post('/api/register', [AuthController::class, 'register']);
$router->post('/api/login', [AuthController::class, 'login']);
$router->get('/api/me', [AuthController::class, 'me']);
$router->post('/api/logout', [AuthController::class, 'logout']);