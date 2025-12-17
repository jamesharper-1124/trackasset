<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// 1. Redirect Home to Login
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. View Routes (Main Pages)
Route::view('/dashboard', 'dashboard')->name('dashboard');
Route::view('/inventories', 'inventories')->name('inventories');
Route::view('/reports', 'reports')->name('reports');
Route::view('/rooms', 'rooms')->name('rooms');
Route::view('/users', 'users')->name('users');
Route::view('/settings', 'profile_settings')->name('settings');

// 3. Sub-View Routes (Create/Edit)
// Route through Controllers to ensure data is passed and auth is checked
Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');

Route::get('/inventories/create', [InventoryController::class, 'create'])->name('inventories.create');
Route::get('/inventories/{inventory}/edit', [InventoryController::class, 'edit'])->name('inventories.edit');

Route::get('/rooms/create', [RoomController::class, 'create'])->name('rooms.create');
Route::get('/rooms/{room}/edit', [RoomController::class, 'edit'])->name('rooms.edit');

Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');
Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');

// TEMP: Fix Route Cache for Hosting
Route::get('/fix-routes', function () {
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('view:clear');
    return 'Routes and Cache Cleared! You can now use API routes.';
});

// 2. Login Routes
Route::get('/login', function () {
    return view('login');
})->name('login');
Route::post('/login', [AuthController::class, 'login']);

// 3. Register Routes
Route::get('/register', function () {
    return view('register');
})->name('register');

Route::post('/register', [AuthController::class, 'register']);

// 4. Verification Routes
Route::get('/verify', [AuthController::class, 'showVerifyForm'])->name('verify.page');
Route::post('/verify', [AuthController::class, 'verifyCode'])->name('verify.code');

// 5. Logout
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Forgot Password Routes
Route::get('/forgot-password', [AuthController::class, 'showForgotPasswordForm'])->name('password.request');
Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
Route::get('/reset-password/{token}', [AuthController::class, 'showResetForm'])->name('password.reset');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    // 6. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 7. Inventories
    Route::get('/inventories', [InventoryController::class, 'index'])->name('inventories');
    Route::get('/inventories/add', [InventoryController::class, 'create'])->name('inventories.create');
    Route::get('/inventories/{inventory}/edit', [InventoryController::class, 'edit'])->name('inventories.edit');

    // 8. Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/reports/add', [ReportController::class, 'create'])->name('reports.create');
    Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');

    // 9. Users
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::get('/users/add', [UserController::class, 'create'])->name('users.create');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');

    // 11. Rooms
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/rooms/add', [RoomController::class, 'create'])->name('rooms.create');
    Route::get('/rooms/{room}/edit', [RoomController::class, 'edit'])->name('rooms.edit');
    Route::get('/rooms/{room}/inventories', [RoomController::class, 'showInventories'])->name('rooms.inventories');
});

// Settings Page - Accessible to all Authenticated Users (even if not verified)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/settings', [UserController::class, 'settings'])->name('settings');
});

// Explicit API Routes in web.php
Route::post('/api/login', [AuthController::class, 'login'])->withoutMiddleware(['verified']);

// RESTORED API ROUTES (Moved back from api.php as requested) - COMMENTED OUT TO USE api.php
Route::prefix('api')->withoutMiddleware(['web', 'verified'])->middleware('auth:sanctum')->group(function () {
    // User Info
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });

    // Global Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Dashboard Data
    Route::get('/dashboard/data', [DashboardController::class, 'getData'])->name('dashboard.data');

    // Inventories Data & Actions
    Route::get('/inventories/data', [InventoryController::class, 'getData'])->name('inventories.data');
    Route::post('/inventories', [InventoryController::class, 'store'])->name('inventories.store');
    Route::put('/inventories/{inventory}', [InventoryController::class, 'update'])->name('inventories.update');
    Route::delete('/inventories/{inventory}', [InventoryController::class, 'destroy'])->name('inventories.destroy');

    // Reports Data & Actions
    Route::get('/reports/data', [ReportController::class, 'getData'])->name('reports.data');
    Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
    Route::put('/reports/{report}', [ReportController::class, 'update'])->name('reports.update');
    Route::delete('/reports/bulk-delete', [ReportController::class, 'bulkDestroy'])->name('reports.bulk_delete');
    Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');

    // AJAX Search (Used by Add Report)
    Route::get('/ajax/inventories/search', [ReportController::class, 'search'])->name('ajax.inventories.search');

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


// 12. Explicit API Routes (Login only)
// Note: Other API routes are in routes/api.php
Route::post('/api/login', [AuthController::class, 'login'])->withoutMiddleware(['verified']);
