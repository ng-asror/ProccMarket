<?php

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\BannerController;
use App\Http\Controllers\API\V1\CommentController;
use App\Http\Controllers\API\V1\ConversationController;
use App\Http\Controllers\API\V1\CryptoBotController;
use App\Http\Controllers\API\V1\LikeController;
use App\Http\Controllers\API\V1\MessageController;
use App\Http\Controllers\API\V1\NewsController;
use App\Http\Controllers\API\V1\NewsLikeController;
use App\Http\Controllers\API\V1\NewsShareController;
use App\Http\Controllers\API\V1\OrderTransactionController;
use App\Http\Controllers\API\V1\PostController;
use App\Http\Controllers\API\V1\PublicApiController;
use App\Http\Controllers\API\V1\ReviewController;
use App\Http\Controllers\API\V1\RoleController;
use App\Http\Controllers\API\V1\SearchController;
use App\Http\Controllers\API\V1\SectionController;
use App\Http\Controllers\API\V1\ShareController;
use App\Http\Controllers\API\V1\TopicController;
use App\Http\Controllers\API\V1\TransactionApiController;
use App\Http\Controllers\API\V1\UploadController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\WebSocketController;
use App\Http\Controllers\API\V1\WithdrawalController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // WebSocket
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    })->middleware('auth:sanctum');

    // IMPORTANT: CryptoBot Webhook must be outside auth middleware
    Route::post('/pay/crypto-bot/webhook', [CryptoBotController::class, 'webhook']);

    /* AUTH ENDPOINTS */
    Route::prefix('auth')->group(function () {
        Route::post('/exist-user', [AuthController::class, 'existUser']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/google', [AuthController::class, 'googleLogin']);
        Route::post('/validate-referral', [AuthController::class, 'validateReferralCode']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::get('/profile', [AuthController::class, 'profile']);
            Route::get('/my-topics', [AuthController::class, 'myTopics']);
            Route::get('/referrals', [AuthController::class, 'referralList']);
            Route::put('/update', [AuthController::class, 'update']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::prefix('reviews')->middleware('auth:sanctum')->group(function () {
        Route::get('/can-review', [ReviewController::class, 'canReview']);
        Route::post('/', [ReviewController::class, 'store']);
    });

    Route::prefix('roles')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/my-purchased-roles', [RoleController::class, 'myPurchasedRoles']);
        Route::post('/purchase', [RoleController::class, 'purchaseRole']);
        Route::post('/switch', [RoleController::class, 'switchRole']);
        Route::get('/statistics', [RoleController::class, 'roleStatistics']);
    });

    /* PUBLIC ENDPOINTS */
    Route::prefix('public')->group(function () {
        Route::get('/all', [PublicApiController::class, 'allPublicData']);
        Route::get('/banners', [BannerController::class, 'index']);
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
            Route::get('/dashboard', [SectionController::class, 'dashboard']); // Dashboard uchun sectionlar
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
            Route::post('/topic/{topic}', [ShareController::class, 'shareTopic']);
            Route::post('/post/{post}', [ShareController::class, 'sharePost']);
        });

        // Search
        Route::get('/search', [SearchController::class, 'search']);

        // File uploads
        Route::post('/upload/image', [UploadController::class, 'uploadImage'])->withoutMiddleware('auth:sanctum');

        // Views tracking
        // Route::post('/topics/{topic}/view', [TopicController::class, 'incrementView']);

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

        // ==========================================
        // NEWS ROUTES
        // ==========================================
        Route::prefix('news')->group(function () {
            Route::get('/', [NewsController::class, 'index']);
            Route::get('/categories', [NewsController::class, 'categories']);
            Route::get('/category/{categoryId}', [NewsController::class, 'byCategory']);
            Route::get('/{id}', [NewsController::class, 'show']);

            // News Like/Dislike (Auth required)
            Route::post('/{news}/like', [NewsLikeController::class, 'toggleNewsLike']);
            Route::get('/{news}/likes', [NewsLikeController::class, 'getNewsLikes']);
            Route::get('/{news}/dislikes', [NewsLikeController::class, 'getNewsDislikes']);

            // News Share (Auth required)
            Route::post('/{news}/share', [NewsShareController::class, 'shareNews']);
            Route::get('/{news}/shares', [NewsShareController::class, 'getNewsShares']);
        });

        // ==========================================
        // COMMENTS ROUTES
        // ==========================================
        Route::prefix('news/{news}/comments')->group(function () {
            Route::get('/', [CommentController::class, 'index']);
            Route::post('/', [CommentController::class, 'store']);
        });

        Route::prefix('comments')->group(function () {
            Route::get('/{comment}', [CommentController::class, 'show']);
            Route::put('/{comment}', [CommentController::class, 'update']);
            Route::patch('/{comment}', [CommentController::class, 'update']);
            Route::delete('/{comment}', [CommentController::class, 'destroy']);

            // Comment Like/Dislike (Auth required)
            Route::post('/{comment}/like', [NewsLikeController::class, 'toggleCommentLike']);
            Route::get('/{comment}/likes', [NewsLikeController::class, 'getCommentLikes']);
            Route::get('/{comment}/dislikes', [NewsLikeController::class, 'getCommentDislikes']);

            // Comment Share (Auth required)
            Route::post('/{comment}/share', [NewsShareController::class, 'shareComment']);
            Route::get('/{comment}/shares', [NewsShareController::class, 'getCommentShares']);
        });

        Route::prefix('transactions')->group(function () {
            Route::get('/', [TransactionApiController::class, 'index']);
            Route::get('/export', [TransactionApiController::class, 'export']);
            Route::get('/{transaction}', [TransactionApiController::class, 'show']);
        });

        // ==========================================
        // CHAT ROUTES
        // ==========================================
        Route::prefix('chat')->group(function () {
            // User routes
            Route::get('/users/me', [UserController::class, 'me']);
            Route::get('/users/{user}', [UserController::class, 'show']);

            // Conversation routes
            Route::get('/conversations', [ConversationController::class, 'index']);
            Route::post('/conversations', [ConversationController::class, 'store']);
            Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
            Route::delete('/conversations/{conversation}', [ConversationController::class, 'destroy']);

            // Message routes
            Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);
            Route::get('/messages/{message}', [MessageController::class, 'show']);
            Route::put('/messages/{message}', [MessageController::class, 'update']);
            Route::post('/messages/{message}/read', [MessageController::class, 'markAsRead']);
            Route::delete('/messages/{message}', [MessageController::class, 'destroy']);

            // Order Transaction routes
            
            Route::prefix('conversations/{conversation}/orders')->group(function () {
                Route::get('/', [OrderTransactionController::class, 'index']);
                Route::post('/', [OrderTransactionController::class, 'store']);
            });

            Route::prefix('orders')->group(function () {
                Route::get('/{orderTransaction}', [OrderTransactionController::class, 'show']);
                Route::post('/{orderTransaction}/accept', [OrderTransactionController::class, 'accept']);
                Route::post('/{orderTransaction}/deliver', [OrderTransactionController::class, 'deliver']);
                Route::post('/{orderTransaction}/complete', [OrderTransactionController::class, 'complete']);
                
                // Pending orders uchun cancel
                Route::post('/{orderTransaction}/cancel', [OrderTransactionController::class, 'cancel']);
                
                // YANGI: Qayta ishlashga yuborish (delivered -> in_progress)
                Route::post('/{orderTransaction}/request-revision', [OrderTransactionController::class, 'requestRevision']);
                
                // Accepted orders uchun cancellation request flow
                Route::post('/{orderTransaction}/request-cancellation', [OrderTransactionController::class, 'requestCancellation']);
                Route::post('/{orderTransaction}/approve-cancellation', [OrderTransactionController::class, 'approveCancellation']);
                Route::post('/{orderTransaction}/reject-cancellation', [OrderTransactionController::class, 'rejectCancellation']);
                
                Route::post('/{orderTransaction}/dispute', [OrderTransactionController::class, 'dispute']);
            });
        });
    });

});
