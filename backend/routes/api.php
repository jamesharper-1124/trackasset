<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public API Routes
// Public API Routes
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/verify', [AuthController::class, 'verifyCode'])->name('api.verify.code');

// Forgot Password Routes
Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoomController;

Route::middleware('auth:sanctum')->group(function () {
    // Global Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard Data
    Route::get('/dashboard/data', [DashboardController::class, 'getData'])->name('dashboard.data');

    // Inventories Data & Actions
    Route::get('/inventories/data', [InventoryController::class, 'getData'])->name('inventories.data');
    Route::post('/inventories', [InventoryController::class, 'store'])->name('inventories.store');
    Route::put('/inventories/{inventory}', [InventoryController::class, 'update'])->name('inventories.update');
    Route::delete('/inventories/{inventory}', [InventoryController::class, 'destroy'])->name('inventories.destroy');

    // Reports Data
    Route::get('/reports/data', [ReportController::class, 'getData'])->name('reports.data');

    // Users Data & Actions
    Route::get('/users/data', [UserController::class, 'getData'])->name('users.data');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/bulk-delete', [UserController::class, 'bulkDelete'])->name('users.bulk_delete');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Rooms Data & Actions
    Route::get('/rooms/data', [RoomController::class, 'getData'])->name('rooms.data');
    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::put('/rooms/{room}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/bulk-delete', [RoomController::class, 'bulkDestroy'])->name('rooms.bulk_delete');
    Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::get('/rooms/{room}/inventories', [RoomController::class, 'showInventories'])->name('rooms.inventories');

    // Settings Update
    Route::put('/settings', [UserController::class, 'updateSettings'])->name('settings.update');
});

