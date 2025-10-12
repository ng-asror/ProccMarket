<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\NewsController;
use App\Http\Controllers\Admin\OrderTransactionAdminController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\TopicController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WithdrawalController;
use App\Http\Controllers\GoogleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    // redirect to login page
    return redirect()->route('dashboard');
})->name('home');

Route::get('auth/google', [GoogleController::class, 'redirectToGoogle']);
Route::get('auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('/{user}', [UserController::class, 'show'])->name('admin.users.show');
        Route::post('/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::patch('/{user}/password', [UserController::class, 'updatePassword'])->name('admin.users.password.update');
        Route::patch('/{user}/balance', [UserController::class, 'updateBalance'])->name('admin.users.balance.update');
        Route::post('/{user}/ban', [UserController::class, 'ban'])->name('admin.users.ban');
        Route::post('/{user}/unban', [UserController::class, 'unban'])->name('admin.users.unban');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    });

    Route::group(['prefix' => 'roles'], function () {
        Route::get('/', [RoleController::class, 'index'])->name('admin.roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('admin.roles.store');
        Route::patch('/{role}', [RoleController::class, 'update'])->name('admin.roles.update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('admin.roles.destroy');
    });

    Route::group(['prefix' => 'config'], function () {
        Route::get('/', [SettingController::class, 'index'])->name('admin.settings.index');
        Route::post('/', [SettingController::class, 'store'])->name('admin.settings.store');
        Route::patch('/{setting}', [SettingController::class, 'update'])->name('admin.settings.update');
        Route::delete('/{setting}', [SettingController::class, 'destroy'])->name('admin.settings.destroy');
    });

    Route::resource('sections', SectionController::class)->names('admin.sections')->middleware(['auth', 'admin']);
    Route::post('sections/update-positions', [SectionController::class, 'updatePositions'])->name('admin.sections.update-positions');
    Route::get('sections-search', [SectionController::class, 'search'])->name('admin.sections.search');

    Route::resource('topics', TopicController::class)->names('admin.topics');
    Route::patch('topics/{topic}/toggle-status', [TopicController::class, 'toggleStatus'])->name('admin.topics.toggle-status');
    Route::post('topics/bulk-delete', [TopicController::class, 'bulkDelete'])->name('admin.topics.bulk-delete');
    Route::post('topics/bulk-toggle-status', [TopicController::class, 'bulkToggleStatus'])->name('admin.topics.bulk-toggle-status');

    Route::group(['prefix' => 'transactions'], function () {
        Route::get('/', [TransactionController::class, 'adminIndex'])->name('admin.transactions.index');
        Route::get('/{transaction}', [TransactionController::class, 'show'])->name('admin.transactions.show');
        Route::patch('/{transaction}/status', [TransactionController::class, 'updateStatus'])->name('admin.transactions.updateStatus');
        Route::get('/user/{user}', [TransactionController::class, 'index'])->name('admin.transactions.user.show');
    });
    Route::get('/export-csv', [TransactionController::class, 'export'])->name('admin.transactions.export');

    /* WITHDRAWAL MANAGEMENT */
    Route::prefix('withdrawals')->name('admin.withdrawals.')->group(function () {
        Route::get('/', [WithdrawalController::class, 'index'])->name('index');
        Route::get('/export', [WithdrawalController::class, 'export'])->name('export');
        Route::get('/{withdrawal}', [WithdrawalController::class, 'show'])->name('show');
        Route::post('/{withdrawal}/approve', [WithdrawalController::class, 'approve'])->name('approve');
        Route::post('/{withdrawal}/reject', [WithdrawalController::class, 'reject'])->name('reject');
    });

    // News Routes
    Route::get('/news', [NewsController::class, 'index'])->name('news.index');
    Route::get('/news/create', [NewsController::class, 'create'])->name('news.create');
    Route::post('/news', [NewsController::class, 'store'])->name('news.store');
    Route::get('/news/{news}/edit', [NewsController::class, 'edit'])->name('news.edit');
    Route::put('/news/{news}', [NewsController::class, 'update'])->name('news.update');
    Route::delete('/news/{news}', [NewsController::class, 'destroy'])->name('news.destroy');

    // Category Routes
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::prefix('reviews')->name('admin.reviews.')->group(function () {
        Route::get('/', [ReviewController::class, 'index'])->name('index');
        Route::get('/{review}', [ReviewController::class, 'show'])->name('show');
        Route::delete('/{review}', [ReviewController::class, 'destroy'])->name('destroy');
        Route::get('/user/{user}', [ReviewController::class, 'userReviews'])->name('user');
        Route::get('/export/csv', [ReviewController::class, 'export'])->name('export');
    });

    // Order Transactions (Escrow) Management
    Route::prefix('order-transactions')->name('admin.order-transactions.')->group(function () {
        Route::get('/', [OrderTransactionAdminController::class, 'index'])->name('index');
        Route::get('/{orderTransaction}', [OrderTransactionAdminController::class, 'show'])->name('show');
        Route::post('/{orderTransaction}/resolve-dispute', [OrderTransactionAdminController::class, 'resolveDispute'])->name('resolve-dispute');
        Route::post('/{orderTransaction}/force-cancel', [OrderTransactionAdminController::class, 'forceCancel'])->name('force-cancel');
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
