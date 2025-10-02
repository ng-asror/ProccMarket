<?php

use App\Http\Controllers\API\V1\SectionController;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\CryptoBotController;
use App\Http\Controllers\API\V1\PublicApiController;
use App\Http\Controllers\API\V1\WebSocketController;
use App\Http\Controllers\API\V1\LikeController;
use App\Http\Controllers\API\V1\PostController;
use App\Http\Controllers\API\V1\SearchController;
use App\Http\Controllers\API\V1\ShareController;
use App\Http\Controllers\API\V1\TopicController;
use App\Http\Controllers\API\V1\UploadController;
use App\Http\Controllers\API\V1\WithdrawalController;
use App\Http\Controllers\GoogleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {    
    // IMPORTANT: CryptoBot Webhook must be outside auth middleware
    Route::post('/pay/crypto-bot/webhook', [CryptoBotController::class, 'webhook']);

    /* AUTH ENDPOINTS */
    Route::prefix('auth')->group(function () {
        Route::post('/exist-user', [AuthController::class, 'existUser']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/google', [AuthController::class, 'googleLogin']);
    
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/update', [AuthController::class, 'update']);
            Route::put('/update-role', [AuthController::class, 'updateRole']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    /* PUBLIC ENDPOINTS */
    Route::prefix('public')->group(function () {
        Route::get('/all', [PublicApiController::class, 'allPublicData']);
        Route::get('/roles', [PublicApiController::class, 'getRoles']);
        Route::get('/settings', [PublicApiController::class, 'getSettings']);
        Route::get('/settings/{key}', [PublicApiController::class, 'getSettingByKey']);
    });

    Route::get('/pay/crypto-bot/exchange-rates', [CryptoBotController::class, 'getExchangeRates']);
    Route::get('/pay/crypto-bot/currencies', [CryptoBotController::class, 'getCurrencies']);

    /* FORUM ENDPOINTS */
    Route::middleware('auth:sanctum')->group(function () {

        // WebSocket endpoints
        Route::prefix('ws')->group(function () {
            Route::post('/send-message', [WebSocketController::class, 'sendMessage']);
            Route::post('/toggle-like', [WebSocketController::class, 'toggleLike']);
            Route::post('/user-typing', [WebSocketController::class, 'userTyping']);
            Route::get('/online-users/{channelType}/{channelId}', [WebSocketController::class, 'getOnlineUsers']);
        });
        
        // Sections (Forums)
        Route::prefix('sections')->group(function () {
            Route::get('/', [SectionController::class, 'index']); // Barcha sectionlar
            Route::get('/{section}', [SectionController::class, 'show']); // Section ma'lumotlari
            Route::post('/{section}/purchase', [SectionController::class, 'purchase']); // Section sotib olish
        });

        // Topics
        Route::prefix('topics')->group(function () {
            Route::get('/section/{section}', [TopicController::class, 'index']); // Section ichidagi topiclar
            Route::post('/section/{section}', [TopicController::class, 'store']); // Yangi topic yaratish
            Route::get('/{topic}', [TopicController::class, 'show']); // Topic ko'rish
            Route::put('/{topic}', [TopicController::class, 'update']); // Topic tahrirlash
            Route::delete('/{topic}', [TopicController::class, 'destroy']); // Topic o'chirish
        });

        // Posts
        Route::prefix('posts')->group(function () {
            Route::get('/topic/{topic}', [PostController::class, 'index']); // Topic ichidagi postlar
            Route::post('/topic/{topic}', [PostController::class, 'store']); // Yangi post yaratish
            Route::get('/{post}', [PostController::class, 'show']); // Post ko'rish
            Route::put('/{post}', [PostController::class, 'update']); // Post tahrirlash
            Route::delete('/{post}', [PostController::class, 'destroy']); // Post o'chirish
        });

        // Likes
        Route::prefix('likes')->group(function () {
            Route::post('/topic/{topic}', [LikeController::class, 'toggleTopicLike']);
            Route::post('/post/{post}', [LikeController::class, 'togglePostLike']);
        });

        // Shares
        Route::prefix('shares')->group(function () {
            Route::post('/topic/{topic}', [ShareController::class, 'shareTopicCount']);
            Route::post('/post/{post}', [ShareController::class, 'sharePostCount']);
        });

        // Search
        Route::get('/search', [SearchController::class, 'search']);

        // File uploads
        Route::post('/upload/image', [UploadController::class, 'uploadImage']);
        
        // Views tracking
        Route::post('/topics/{topic}/view', [TopicController::class, 'incrementView']);

        // CryptoBot Payment Endpoints
        Route::prefix('pay/crypto-bot')->group(function () {
            Route::get('/get-me', [CryptoBotController::class, 'getMe']);
            Route::get('/balance', [CryptoBotController::class, 'balance']);
            Route::post('/create-invoice', [CryptoBotController::class, 'createInvoice']);
            Route::get('/invoices', [CryptoBotController::class, 'getInvoices']);
            // Route::post('/transfer', [CryptoBotController::class, 'transfer']);
        });

        // Withdrawal Endpoints
        Route::prefix('withdrawals')->group(function () {
            Route::get('/', [WithdrawalController::class, 'index']);
            Route::post('/', [WithdrawalController::class, 'store']);
            Route::get('/check-eligibility', [WithdrawalController::class, 'checkEligibility']);
            Route::get('/{withdrawal}', [WithdrawalController::class, 'show']);
            Route::patch('/{withdrawal}/cancel', [WithdrawalController::class, 'cancel']);
        });
    });

});