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

// Global prefix for all API routes
Router::group(['prefix' => 'api/v1'], function () {

    Router::get('/', [HealthController::class, 'index']);
    Router::get('health', [HealthController::class, 'index']);

    // --- AUTH ROUTES ---
    Router::group(['prefix' => 'auth'], function () {
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

    // --- PUBLIC PRODUCT ROUTES ---
    Router::group(['prefix' => 'products'], function () {
        Router::get('/', [ProductController::class, 'index']);
        Router::get('featured', [ProductController::class, 'featured']);
        Router::get('categories', [CategoryController::class, 'index']);
        Router::get('brands', [ProductController::class, 'brands']);
        Router::get('lenses/available', [LensController::class, 'available']);
        Router::get('related', [ProductController::class, 'related']);
        Router::get('{id}', [ProductController::class, 'show']);
    });

    // --- PROTECTED PROFILE & ADDRESS ROUTES ---
    Router::group(['prefix' => 'profile', 'middleware' => ['auth:sanctum', 'permission:manage_profile']], function () {
        Router::get('/', [ProfileController::class, 'show']);
        Router::put('/', [ProfileController::class, 'update']);
        Router::post('avatar', [ProfileController::class, 'uploadAvatar']);
        
        Router::get('addresses', [AddressController::class, 'index']);
        Router::post('addresses', [AddressController::class, 'store']);
        Router::put('addresses/{id}', [AddressController::class, 'update']);
        Router::delete('addresses/{id}', [AddressController::class, 'destroy']);
    });

    // --- SHOPPING ROUTES ---
    Router::group(['middleware' => 'auth:sanctum'], function() {
        
        // Cart
        Router::group(['prefix' => 'cart', 'middleware' => 'permission:manage_cart'], function () {
            Router::get('/', [CartController::class, 'index']);
            Router::post('/', [CartController::class, 'store']);
            Router::post('voucher', [CartController::class, 'applyVoucher']);
            Router::delete('voucher', [CartController::class, 'removeVoucher']);
            Router::put('items/{id}', [CartController::class, 'update']);
            Router::delete('items/{id}', [CartController::class, 'destroy']);
            Router::post('toggle-selection', [CartController::class, 'toggleSelection']);
            Router::post('select-all', [CartController::class, 'selectAll']);
        });

        // Wishlist
        Router::group(['prefix' => 'wishlist', 'middleware' => 'permission:manage_cart'], function () {
            Router::get('/', [WishlistController::class, 'index']);
            Router::post('toggle', [WishlistController::class, 'toggle']);
            Router::delete('{id}', [WishlistController::class, 'destroy']);
        });

        // Checkout & Orders
        Router::group(['prefix' => 'checkout', 'middleware' => 'permission:checkout'], function () {
            Router::post('/', [CheckoutController::class, 'store']);
        });

        Router::group(['prefix' => 'orders'], function () {
            Router::get('/', [OrderController::class, 'index']);
            Router::get('{id}', [OrderController::class, 'show']);
        });

        Router::group(['prefix' => 'prescriptions', 'middleware' => 'permission:create_order|validate_prescription'], function () {
            Router::get('/', [PrescriptionController::class, 'index']);
            Router::post('/', [PrescriptionController::class, 'store']);
        });

        // Payments
        Router::group(['prefix' => 'payments'], function () {
            Router::post('process', [PaymentController::class, 'process'])->middleware('permission:make_payment');
            Router::get('status',  [PaymentController::class, 'status']);
            
            Router::group(['middleware' => 'permission:confirm_order'], function() {
                Router::post('confirm', [PaymentController::class, 'confirm']);
                Router::get('pending', [PaymentController::class, 'pendingPayments']);
            });
        });

        // Support
        Router::group(['prefix' => 'support'], function () {
            Router::get('/', [SupportTicketController::class, 'index']);
            Router::post('/', [SupportTicketController::class, 'store']);
            Router::get('{id}', [SupportTicketController::class, 'show']);
            Router::post('reply', [SupportTicketController::class, 'reply']);
            
            Router::group(['middleware' => 'permission:contact_customer'], function() {
                Router::post('status', [SupportTicketController::class, 'updateStatus']);
                Router::delete('delete', [SupportTicketController::class, 'delete']);
            });
        });
    });

    // --- STAFF & ADMIN ROUTES ---
    Router::group(['middleware' => ['auth:sanctum']], function () {
        
        // Sales & Operations
        Router::group(['prefix' => 'sales'], function () {
            Router::get('orders', [SalesController::class, 'listOrders'])->middleware('permission:view_orders');
            Router::get('orders/{id}', [SalesController::class, 'showOrder'])->middleware('permission:view_orders');
            Router::post('verify', [SalesController::class, 'verify'])->middleware('permission:confirm_order');
            Router::post('complaint', [SalesController::class, 'complaint'])->middleware('permission:handle_returns');
            Router::get('order-complaints', [SalesController::class, 'orderComplaints'])->middleware('permission:handle_returns');
            Router::put('prescription', [SalesController::class, 'updatePrescription'])->middleware('permission:validate_prescription');
        });

        Router::group(['prefix' => 'ops'], function () {
            Router::get('/', [OperationsController::class, 'index'])->middleware('permission:view_orders|pack_order|create_shipment|update_order_status');
            Router::post('advance', [OperationsController::class, 'advanceProduction'])->middleware('permission:update_order_status|pack_order');
            Router::post('shipments', [OperationsController::class, 'createShipment'])->middleware('permission:create_shipment');
            Router::put('shipments', [OperationsController::class, 'updateShipment'])->middleware('permission:update_tracking');
        });

        // Admin Dashboard & Management
        Router::group(['prefix' => 'admin'], function () {
            
            Router::group(['prefix' => 'inventory'], function () {
                Router::get('/', [InventoryController::class, 'index'])->middleware('permission:manage_products|process_preorder_inventory');
                Router::put('stock', [InventoryController::class, 'updateStock'])->middleware('permission:manage_products|process_preorder_inventory');
            });

            Router::group(['prefix' => 'products', 'middleware' => 'permission:manage_products'], function () {
                Router::post('/', [ProductController::class, 'store']);
                Router::put('/', [ProductController::class, 'update']);
                Router::put('{id}', [ProductController::class, 'update']);
                Router::delete('/', [ProductController::class, 'destroy']);
                Router::delete('{id}', [ProductController::class, 'destroy']);
            });

            Router::group(['middleware' => 'permission:manage_users'], function() {
                Router::get('users', [AdminController::class, 'listUsers']);
                Router::post('staff', [AdminController::class, 'createStaff']);
                Router::get('users/{id}', [AdminController::class, 'getUser']);
                Router::put('users/{id}', [AdminController::class, 'updateUser']);
                Router::delete('staff/{id}', [AdminController::class, 'deleteStaff']);
            });

            Router::get('roles', [AdminController::class, 'listRoles'])->middleware('permission:manage_roles');
            Router::post('config', [AdminController::class, 'setConfig'])->middleware('permission:manage_system_config');
            Router::get('config', [AdminController::class, 'getConfig'])->middleware('permission:manage_system_config');

            Router::group(['prefix' => 'vouchers', 'middleware' => 'permission:manage_promotions'], function () {
                Router::post('/', [AdminController::class, 'createVoucher']);
                Router::get('/', [AdminController::class, 'listVouchers']);
                Router::put('{id}', [AdminController::class, 'updateVoucher']);
                Router::delete('{id}', [AdminController::class, 'deleteVoucher']);
            });
        });

        Router::group(['prefix' => 'dashboard', 'middleware' => 'permission:view_reports'], function () {
            Router::get('/', [DashboardController::class, 'index']);
            Router::get('operations', [DashboardController::class, 'operations']);
            Router::get('sales-report', [DashboardController::class, 'salesReport']);
        });
    });
});
