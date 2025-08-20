<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\SettingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    // redirect to login page
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('/{user}', [UserController::class, 'show'])->name('admin.users.show');
        Route::patch('/{user}', [UserController::class, 'update'])->name('admin.users.update');
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
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
