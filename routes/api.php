<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DelegateController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WilayaController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OperatorController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\DelegateObjectiveController;
use App\Http\Controllers\Api\ClientObjectiveController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/login', [AuthController::class, 'login']);

// Roles & Permissions routes (Public / Auth)
Route::get('/roles/modules', [RoleController::class, 'modules']);
Route::get('/roles', [RoleController::class, 'index']);

// Delegate & Client Objectives (Public / Auth)
Route::get('/delegates/{delegate}/objectives', [DelegateObjectiveController::class, 'index']);
Route::post('/delegates/{delegate}/objectives', [DelegateObjectiveController::class, 'storeOrUpdate']);
Route::get('/clients/{client}/objectives', [ClientObjectiveController::class, 'index']);
Route::post('/clients/{client}/objectives', [ClientObjectiveController::class, 'storeOrUpdate']);

// Reports routes (Public / Auth)
Route::get('/reports/kpis', [ReportController::class, 'kpis']);
Route::get('/reports/revenue-overview', [ReportController::class, 'revenueOverview']);
Route::get('/reports/by-region', [ReportController::class, 'revenueByRegion']);
Route::get('/reports/sales-trends', [ReportController::class, 'salesTrends']);
Route::get('/reports/order-status', [ReportController::class, 'orderStatusDistribution']);
Route::get('/reports/top-delegates', [ReportController::class, 'topDelegates']);
Route::get('/reports/best-products', [ReportController::class, 'bestProducts']);
Route::get('/reports', [ReportController::class, 'index']);
Route::post('/reports', [ReportController::class, 'store']);
Route::delete('/reports/{id}', [ReportController::class, 'destroy']);
Route::post('/reports/bulk', [ReportController::class, 'bulkAction']);

// Notifications routes (Public / Auth)
Route::get('/notifications/kpis', [NotificationController::class, 'kpis']);
Route::get('/notifications/analytics', [NotificationController::class, 'analytics']);
Route::get('/notifications/announcements', [NotificationController::class, 'announcements']);
Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications', [NotificationController::class, 'store']);
Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::get('/notifications/sent-broadcasts', [NotificationController::class, 'sentBroadcasts']);
Route::post('/notifications/send-broadcast', [NotificationController::class, 'sendBroadcast']);
Route::post('/notifications/fcm-token', [NotificationController::class, 'updateFcmToken']);
Route::post('/notifications/bulk', [NotificationController::class, 'bulkAction']);
Route::post('/notifications/announcements', [NotificationController::class, 'storeAnnouncement']);

// Public / fallback routes for wilayas, regions, operators, categories & orders
Route::get('/wilayas/kpis', [WilayaController::class, 'kpis']);
Route::get('/wilayas/analytics', [WilayaController::class, 'analytics']);
Route::get('/wilayas', [WilayaController::class, 'index']);
Route::get('/wilayas/{wilaya}', [WilayaController::class, 'show']);

Route::get('/regions/kpis', [RegionController::class, 'kpis']);
Route::get('/regions/analytics', [RegionController::class, 'analytics']);
Route::get('/regions', [RegionController::class, 'index']);
Route::get('/regions/{region}', [RegionController::class, 'show']);
Route::post('/regions', [RegionController::class, 'store']);
Route::put('/regions/{region}', [RegionController::class, 'update']);
Route::delete('/regions/{region}', [RegionController::class, 'destroy']);

Route::get('/operators', [OperatorController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);

// Orders public access / fallback
Route::get('/clients/filter-options', [ClientController::class, 'filterOptions']);
Route::get('/orders/kpis', [OrderController::class, 'kpis']);
Route::get('/profile/kpis', [OrderController::class, 'profileKpis']);
Route::get('/orders/stream', [OrderController::class, 'stream']);
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
// Stock public access / fallback
Route::get('/stock/kpis', [StockController::class, 'kpis']);
Route::get('/stock/analytics', [StockController::class, 'analytics']);
Route::get('/stock/filter-options', [StockController::class, 'filterOptions']);
Route::get('/stock/movements', [StockController::class, 'index']);
Route::post('/stock/movements', [StockController::class, 'store']);
Route::get('/warehouses', [WarehouseController::class, 'index']);
Route::post('/warehouses', [WarehouseController::class, 'store']);
Route::put('/warehouses/{warehouse}', [WarehouseController::class, 'update']);
Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy']);
Route::post('/warehouses/{warehouse}/set-default', [WarehouseController::class, 'setDefault']);

// Heartbeat & offline presence routes (Public & Auth)
Route::get('/delegates/filter-options', [DelegateController::class, 'filterOptions']);
Route::post('/delegates/heartbeat', [DelegateController::class, 'heartbeat']);
Route::post('/delegates/offline', [DelegateController::class, 'offline']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'profile']);

    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::post('/warehouses', [WarehouseController::class, 'store']);
    Route::put('/warehouses/{warehouse}', [WarehouseController::class, 'update']);
    Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy']);
    Route::post('/warehouses/{warehouse}/set-default', [WarehouseController::class, 'setDefault']);

    Route::get('/stock/kpis', [StockController::class, 'kpis']);
    Route::get('/stock/analytics', [StockController::class, 'analytics']);
    Route::get('/stock/filter-options', [StockController::class, 'filterOptions']);
    Route::get('/stock/movements', [StockController::class, 'index']);
    Route::post('/stock/movements', [StockController::class, 'store']);

    Route::get('/orders/kpis', [OrderController::class, 'kpis']);
    Route::get('/profile/kpis', [OrderController::class, 'profileKpis']);
    Route::get('/clients/filter-options', [ClientController::class, 'filterOptions']);
    Route::get('/clients/kpis', [ClientController::class, 'kpis']);
    Route::get('/clients/analytics', [ClientController::class, 'analytics']);
    Route::post('/clients/bulk', [ClientController::class, 'bulkAction']);
    Route::apiResource('/clients', ClientController::class);

    Route::get('/delegates/filter-options', [DelegateController::class, 'filterOptions']);
    Route::get('/delegates/kpis', [DelegateController::class, 'kpis']);
    Route::get('/delegates/analytics', [DelegateController::class, 'analytics']);
    Route::post('/delegates/bulk', [DelegateController::class, 'bulkAction']);
    Route::apiResource('/delegates', DelegateController::class);

    Route::get('/products/kpis', [ProductController::class, 'kpis']);
    Route::get('/products/analytics', [ProductController::class, 'analytics']);
    Route::post('/products/bulk', [ProductController::class, 'bulkAction']);
    Route::apiResource('/products', ProductController::class);

    Route::apiResource('/regions', RegionController::class)->except(['index', 'show']);

    Route::apiResource('/operators', OperatorController::class)->except(['index']);
    Route::apiResource('/categories', CategoryController::class)->except(['index']);

    Route::apiResource('/orders', OrderController::class)->except(['index', 'show', 'store']);

    // User management strictly protected by users.manage permission
    Route::middleware('permission:users.manage')->group(function () {
        Route::get('/users/kpis', [UserController::class, 'kpis']);
        Route::get('/users/analytics', [UserController::class, 'analytics']);
        Route::post('/users/bulk', [UserController::class, 'bulkAction']);
        Route::apiResource('/users', UserController::class);
    });

    // Role modification protected by settings.manage
    Route::middleware('permission:settings.manage')->group(function () {
        Route::post('/roles', [RoleController::class, 'store']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
    });

    Route::post('/wilayas/bulk', [WilayaController::class, 'bulkAction']);
    Route::post('/wilayas', [WilayaController::class, 'store']);
    Route::put('/wilayas/{wilaya}', [WilayaController::class, 'update']);
    Route::delete('/wilayas/{wilaya}', [WilayaController::class, 'destroy']);
});
