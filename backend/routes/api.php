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
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\SalesController;
use App\Http\Controllers\Api\V1\SupportTicketController;
use App\Http\Controllers\Api\V1\OperationsController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\WishlistController;
use App\Http\Controllers\Api\V1\PrescriptionController;

Router::get('/', [HealthController::class, 'index']);
Router::get('api/health', [HealthController::class, 'index']);

// Public Product Routes
Router::group(['prefix' => 'api/v1/products'], function () {
    Router::get('/', [ProductController::class, 'index']);
    Router::get('show', [ProductController::class, 'show']);
    Router::get('categories', [CategoryController::class, 'index']);
    Router::get('brands', [ProductController::class, 'brands']);
    Router::get('lenses/available', [LensController::class, 'available']);
});

// Backward-compatible aliases
Router::get('api/v1/categories', [CategoryController::class, 'index']);
Router::get('api/v1/lenses/available', [LensController::class, 'available']);

// Auth Routes
Router::group(['prefix' => 'api/auth'], function () {
    Router::post('register', [AuthController::class, 'register']);
    Router::post('login', [AuthController::class, 'login']);
    Router::get('verify', [AuthController::class, 'verify']);
    Router::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Router::post('reset-password', [AuthController::class, 'resetPassword']);
    Router::post('logout', [AuthController::class, 'logout']);
    
    // Authenticated Auth Routes
    Router::group(['middleware' => 'auth:sanctum'], function() {
        Router::post('change-password', [AuthController::class, 'changePassword']);
        Router::get('me', [AuthController::class, 'me']);
    });
});

// Protected Profile & Address Routes
Router::group(['prefix' => 'api/profile', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [ProfileController::class, 'show']);
    Router::put('/', [ProfileController::class, 'update']);
    Router::post('avatar', [ProfileController::class, 'uploadAvatar']);
    
    Router::get('addresses', [AddressController::class, 'index']);
    Router::post('addresses', [AddressController::class, 'store']);
    Router::put('addresses/{id}', [AddressController::class, 'update']);
    Router::delete('addresses/{id}', [AddressController::class, 'destroy']);
});

// Shopping Routes
Router::group(['prefix' => 'api/v1/cart', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [CartController::class, 'index']);
    Router::post('/', [CartController::class, 'store']);
    Router::put('update', [CartController::class, 'update']);
    Router::post('toggle-selection', [CartController::class, 'toggleSelection']);
    Router::post('select-all', [CartController::class, 'selectAll']);
    Router::delete('delete', [CartController::class, 'destroy']);
});

Router::group(['prefix' => 'api/v1/wishlist', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [WishlistController::class, 'index']);
    Router::post('toggle', [WishlistController::class, 'toggle']);
    Router::delete('delete', [WishlistController::class, 'destroy']);
});

Router::group(['prefix' => 'api/v1/checkout', 'middleware' => 'auth:sanctum'], function () {
    Router::post('/', [CheckoutController::class, 'store']);
});

Router::group(['prefix' => 'api/v1/orders', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [OrderController::class, 'index']);
    Router::get('show', [OrderController::class, 'show']);
});

Router::group(['prefix' => 'api/v1/prescriptions', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [PrescriptionController::class, 'index']);
    Router::post('/', [PrescriptionController::class, 'store']);
});

// Payments
Router::group(['prefix' => 'api/v1/payments', 'middleware' => 'auth:sanctum'], function () {
    Router::post('process', [PaymentController::class, 'process']);
    Router::get('status',  [PaymentController::class, 'status']);
    
    // Staff only payment routes
    Router::group(['middleware' => 'role:system_admin|manager|sales_staff'], function() {
        Router::post('confirm', [PaymentController::class, 'confirm']);
        Router::get('pending', [PaymentController::class, 'pendingPayments']);
    });
});

// Support
Router::group(['prefix' => 'api/v1/support', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [SupportTicketController::class, 'index']);
    Router::post('/', [SupportTicketController::class, 'store']);
    Router::get('show', [SupportTicketController::class, 'show']);
    Router::post('reply', [SupportTicketController::class, 'reply']);
    
    // Staff only support routes
    Router::group(['middleware' => 'role:system_admin|manager|sales_staff'], function() {
        Router::post('status', [SupportTicketController::class, 'updateStatus']);
        Router::delete('delete', [SupportTicketController::class, 'delete']);
    });
});

// Sales & Operations (Staff Only)
Router::group(['prefix' => 'api/v1/sales', 'middleware' => ['auth:sanctum', 'role:system_admin|manager|sales_staff']], function () {
    Router::get('pending-orders', [SalesController::class, 'pendingOrders']);
    Router::post('verify', [SalesController::class, 'verify']);
    Router::post('complaint', [SalesController::class, 'complaint']);
    Router::get('order-complaints', [SalesController::class, 'orderComplaints']);
});

Router::group(['prefix' => 'api/v1/ops', 'middleware' => ['auth:sanctum', 'role:system_admin|manager|operations_staff']], function () {
    Router::get('/', [OperationsController::class, 'index']);
    Router::post('advance', [OperationsController::class, 'advanceProduction']);
    Router::post('shipments', [OperationsController::class, 'createShipment']);
    Router::put('shipments', [OperationsController::class, 'updateShipment']);
});

Router::group(['prefix' => 'api/v1/admin/inventory', 'middleware' => ['auth:sanctum', 'role:system_admin|manager|operations_staff']], function () {
    Router::get('/', [InventoryController::class, 'index']);
    Router::put('stock', [InventoryController::class, 'updateStock']);
});

Router::group(['prefix' => 'api/v1/dashboard', 'middleware' => ['auth:sanctum', 'role:system_admin|manager|sales_staff|operations_staff']], function () {
    Router::get('/', [DashboardController::class, 'index']);
    Router::get('operations', [DashboardController::class, 'operations']);
});

// System Administration (Admin Only)
Router::group(['prefix' => 'api/v1/admin', 'middleware' => ['auth:sanctum', 'role:system_admin|manager']], function () {
    // Staff management
    Router::get('staff', [AdminController::class, 'listStaff']);
    Router::post('staff', [AdminController::class, 'createStaff']);
    Router::get('staff/show', [AdminController::class, 'getStaff']);
    Router::put('staff/update', [AdminController::class, 'updateStaff']);
    Router::delete('staff/delete', [AdminController::class, 'deleteStaff']);

    // Role management
    Router::get('roles', [AdminController::class, 'listRoles']);

    // System configuration
    Router::post('config', [AdminController::class, 'setConfig']);
    Router::get('config', [AdminController::class, 'getConfig']);

    // Voucher management
    Router::post('vouchers', [AdminController::class, 'createVoucher']);
    Router::get('vouchers', [AdminController::class, 'listVouchers']);
    Router::put('vouchers/update', [AdminController::class, 'updateVoucher']);
    Router::delete('vouchers/delete', [AdminController::class, 'deleteVoucher']);
});