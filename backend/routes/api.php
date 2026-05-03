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
    Router::get('categories', [CategoryController::class, 'index']);
    Router::get('brands', [ProductController::class, 'brands']);
    Router::get('lenses/available', [LensController::class, 'available']);
    Router::get('related', [ProductController::class, 'related']);
    Router::get('{id}', [ProductController::class, 'show']);
});

// Backward-compatible aliases
Router::get('api/v1/products/show', [ProductController::class, 'show']);
Router::get('api/v1/categories', [CategoryController::class, 'index']);
Router::get('api/v1/lenses/available', [LensController::class, 'available']);

// Auth Routes
Router::group(['prefix' => 'api/v1/auth'], function () {
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

// Backward-compatible auth aliases
Router::group(['prefix' => 'api/auth'], function () {
    Router::post('register', [AuthController::class, 'register']);
    Router::post('login', [AuthController::class, 'login']);
    Router::get('verify', [AuthController::class, 'verify']);
    Router::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Router::post('reset-password', [AuthController::class, 'resetPassword']);
    Router::post('logout', [AuthController::class, 'logout']);
    Router::group(['middleware' => 'auth:sanctum'], function() {
        Router::post('change-password', [AuthController::class, 'changePassword']);
        Router::get('me', [AuthController::class, 'me']);
    });
});

// Protected Profile & Address Routes
Router::group(['prefix' => 'api/v1/profile', 'middleware' => ['auth:sanctum', 'permission:manage_profile']], function () {
    Router::get('/', [ProfileController::class, 'show']);
    Router::put('/', [ProfileController::class, 'update']);
    Router::post('avatar', [ProfileController::class, 'uploadAvatar']);
    
    Router::get('addresses', [AddressController::class, 'index']);
    Router::post('addresses', [AddressController::class, 'store']);
    Router::put('addresses/{id}', [AddressController::class, 'update']);
    Router::delete('addresses/{id}', [AddressController::class, 'destroy']);
});

// Backward-compatible profile aliases
Router::group(['prefix' => 'api/profile', 'middleware' => ['auth:sanctum', 'permission:manage_profile']], function () {
    Router::get('/', [ProfileController::class, 'show']);
    Router::put('/', [ProfileController::class, 'update']);
    Router::post('avatar', [ProfileController::class, 'uploadAvatar']);
    Router::get('addresses', [AddressController::class, 'index']);
    Router::post('addresses', [AddressController::class, 'store']);
    Router::put('addresses/{id}', [AddressController::class, 'update']);
    Router::delete('addresses/{id}', [AddressController::class, 'destroy']);
});

// Shopping Routes
Router::group(['prefix' => 'api/v1/cart', 'middleware' => ['auth:sanctum', 'permission:manage_cart']], function () {
    Router::get('/', [CartController::class, 'index']);
    Router::post('/', [CartController::class, 'store']);
    Router::put('items/{id}', [CartController::class, 'update']);
    Router::delete('items/{id}', [CartController::class, 'destroy']);
    Router::post('toggle-selection', [CartController::class, 'toggleSelection']);
    Router::post('select-all', [CartController::class, 'selectAll']);
    Router::put('update', [CartController::class, 'update']);
    Router::delete('delete', [CartController::class, 'destroy']);
});

Router::group(['prefix' => 'api/v1/wishlist', 'middleware' => ['auth:sanctum', 'permission:manage_cart']], function () {
    Router::get('/', [WishlistController::class, 'index']);
    Router::post('toggle', [WishlistController::class, 'toggle']);
    Router::delete('{id}', [WishlistController::class, 'destroy']);
    Router::delete('delete', [WishlistController::class, 'destroy']);
});

Router::group(['prefix' => 'api/v1/checkout', 'middleware' => ['auth:sanctum', 'permission:checkout']], function () {
    Router::post('/', [CheckoutController::class, 'store']);
});

Router::group(['prefix' => 'api/v1/orders', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [OrderController::class, 'index']); // Logic internally handles view_own_orders vs view_orders
    Router::get('{id}', [OrderController::class, 'show']);
    Router::get('show', [OrderController::class, 'show']);
});

Router::group(['prefix' => 'api/v1/prescriptions', 'middleware' => ['auth:sanctum', 'permission:create_order|validate_prescription']], function () {
    Router::get('/', [PrescriptionController::class, 'index']);
    Router::post('/', [PrescriptionController::class, 'store']);
});

// Payments
Router::group(['prefix' => 'api/v1/payments', 'middleware' => 'auth:sanctum'], function () {
    Router::post('process', [PaymentController::class, 'process'])->middleware('permission:make_payment');
    Router::get('status',  [PaymentController::class, 'status']);
    
    // Staff only payment routes
    Router::group(['middleware' => 'permission:confirm_order'], function() {
        Router::post('confirm', [PaymentController::class, 'confirm']);
        Router::get('pending', [PaymentController::class, 'pendingPayments']);
    });
});

// Support
Router::group(['prefix' => 'api/v1/support', 'middleware' => 'auth:sanctum'], function () {
    Router::get('/', [SupportTicketController::class, 'index']);
    Router::post('/', [SupportTicketController::class, 'store']);
    Router::get('{id}', [SupportTicketController::class, 'show']);
    Router::get('show', [SupportTicketController::class, 'show']);
    Router::post('reply', [SupportTicketController::class, 'reply']);
    
    // Staff only support routes
    Router::group(['middleware' => 'permission:contact_customer'], function() {
        Router::post('status', [SupportTicketController::class, 'updateStatus']);
        Router::delete('delete', [SupportTicketController::class, 'delete']);
    });
});

// Sales & Operations (Staff Only)
Router::group(['prefix' => 'api/v1/sales', 'middleware' => ['auth:sanctum']], function () {
    Router::get('pending-orders', [SalesController::class, 'pendingOrders'])->middleware('permission:view_orders');
    Router::post('verify', [SalesController::class, 'verify'])->middleware('permission:confirm_order');
    Router::post('complaint', [SalesController::class, 'complaint'])->middleware('permission:handle_returns');
    Router::get('order-complaints', [SalesController::class, 'orderComplaints'])->middleware('permission:handle_returns');
});

Router::group(['prefix' => 'api/v1/ops', 'middleware' => ['auth:sanctum']], function () {
    Router::get('/', [OperationsController::class, 'index'])->middleware('permission:view_orders');
    Router::post('advance', [OperationsController::class, 'advanceProduction'])->middleware('permission:update_order_status');
    Router::post('shipments', [OperationsController::class, 'createShipment'])->middleware('permission:create_shipment');
    Router::put('shipments', [OperationsController::class, 'updateShipment'])->middleware('permission:update_tracking');
});

Router::group(['prefix' => 'api/v1/admin/inventory', 'middleware' => ['auth:sanctum']], function () {
    Router::get('/', [InventoryController::class, 'index'])->middleware('permission:manage_products|process_preorder_inventory');
    Router::put('stock', [InventoryController::class, 'updateStock'])->middleware('permission:manage_products|process_preorder_inventory');
});

Router::group(['prefix' => 'api/v1/admin/products', 'middleware' => ['auth:sanctum', 'permission:manage_products']], function () {
    Router::post('/', [ProductController::class, 'store']);
    Router::put('{id}', [ProductController::class, 'update']);
    Router::delete('{id}', [ProductController::class, 'destroy']);
    Router::put('/', [ProductController::class, 'update']);
    Router::delete('/', [ProductController::class, 'destroy']);
});

Router::group(['prefix' => 'api/v1/dashboard', 'middleware' => ['auth:sanctum', 'permission:view_reports']], function () {
    Router::get('/', [DashboardController::class, 'index']);
    Router::get('operations', [DashboardController::class, 'operations']);
    Router::get('sales-report', [DashboardController::class, 'salesReport']);
});

// System Administration (Admin Only)
Router::group(['prefix' => 'api/v1/admin', 'middleware' => ['auth:sanctum']], function () {
    // Staff management
    Router::get('staff', [AdminController::class, 'listStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::post('staff', [AdminController::class, 'createStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::get('staff/{id}', [AdminController::class, 'getStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::put('staff/{id}', [AdminController::class, 'updateStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::delete('staff/{id}', [AdminController::class, 'deleteStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::get('staff/show', [AdminController::class, 'getStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::put('staff/update', [AdminController::class, 'updateStaff'])->middleware('permission:manage_users|manage_all_users');
    Router::delete('staff/delete', [AdminController::class, 'deleteStaff'])->middleware('permission:manage_users|manage_all_users');

    // Role management
    Router::get('roles', [AdminController::class, 'listRoles'])->middleware('permission:manage_roles');

    // System configuration
    Router::post('config', [AdminController::class, 'setConfig'])->middleware('permission:manage_system_config');
    Router::get('config', [AdminController::class, 'getConfig'])->middleware('permission:manage_system_config');

    // Voucher management
    Router::post('vouchers', [AdminController::class, 'createVoucher'])->middleware('permission:manage_promotions');
    Router::get('vouchers', [AdminController::class, 'listVouchers'])->middleware('permission:manage_promotions');
    Router::put('vouchers/{id}', [AdminController::class, 'updateVoucher'])->middleware('permission:manage_promotions');
    Router::delete('vouchers/{id}', [AdminController::class, 'deleteVoucher'])->middleware('permission:manage_promotions');
    Router::put('vouchers/update', [AdminController::class, 'updateVoucher'])->middleware('permission:manage_promotions');
    Router::delete('vouchers/delete', [AdminController::class, 'deleteVoucher'])->middleware('permission:manage_promotions');
});
