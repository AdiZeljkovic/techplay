<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // System Status (Public)
    Route::get('/system/status', [App\Http\Controllers\Api\V1\SystemController::class, 'status']);

    // Auth (Rate Limited - 60 per minute)
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/auth/register', [App\Http\Controllers\Api\V1\AuthController::class, 'register']);
        Route::post('/auth/login', [App\Http\Controllers\Api\V1\AuthController::class, 'login']);

        // Social Auth (Discord)
        Route::get('/auth/discord/redirect', [App\Http\Controllers\Api\V1\SocialAuthController::class, 'redirect']);
        Route::get('/auth/discord/callback', [App\Http\Controllers\Api\V1\SocialAuthController::class, 'callback']);

        // Social Auth (Battle.net)
        Route::get('/auth/battlenet/redirect', [App\Http\Controllers\Api\V1\BattleNetAuthController::class, 'redirect']);
        Route::get('/auth/battlenet/callback', [App\Http\Controllers\Api\V1\BattleNetAuthController::class, 'callback']);

        // Internal Webhooks (Secured by app logic/middleware typically, or local only)
        Route::post('/webhooks/discord/notify', [App\Http\Controllers\Api\V1\WebhookController::class, 'notify']);
    });

    // Discord Bot Integration (Bot-token authenticated, higher rate limit)
    // 300/min allows for active Discord servers while preventing abuse
    Route::middleware('throttle:300,1')->prefix('discord')->group(function () {
        // User & XP
        Route::get('/user/{discordId}', [App\Http\Controllers\Api\V1\DiscordIntegrationController::class, 'getUser']);
        Route::post('/xp', [App\Http\Controllers\Api\V1\DiscordXpController::class, 'addXp']);
        Route::get('/leaderboard', [App\Http\Controllers\Api\V1\DiscordLeaderboardController::class, 'top']);
        Route::post('/daily', [App\Http\Controllers\Api\V1\DiscordDailyController::class, 'claim']);

        // Subscriptions (news/giveaway notifications)
        Route::get('/subscriptions', [App\Http\Controllers\Api\V1\DiscordSubscriptionController::class, 'index']);
        Route::post('/subscriptions', [App\Http\Controllers\Api\V1\DiscordSubscriptionController::class, 'subscribe']);
        Route::delete('/subscriptions', [App\Http\Controllers\Api\V1\DiscordSubscriptionController::class, 'unsubscribe']);

        // Gift XP
        Route::post('/gift', [App\Http\Controllers\Api\V1\DiscordGiftController::class, 'gift']);

        // Admin Operations
        Route::prefix('admin')->group(function () {
            Route::post('/xp/give', [App\Http\Controllers\Api\V1\DiscordAdminController::class, 'giveXp']);
            Route::post('/xp/remove', [App\Http\Controllers\Api\V1\DiscordAdminController::class, 'removeXp']);
            Route::post('/event', [App\Http\Controllers\Api\V1\DiscordAdminController::class, 'startEvent']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [App\Http\Controllers\Api\V1\AuthController::class, 'logout']);
        Route::post('/auth/refresh', [App\Http\Controllers\Api\V1\AuthController::class, 'refresh']);
        Route::get('/auth/me', [App\Http\Controllers\Api\V1\AuthController::class, 'user']);
        Route::put('/user/profile', [App\Http\Controllers\Api\V1\AuthController::class, 'updateProfile']);
        Route::put('/user/preferences', [App\Http\Controllers\Api\V1\AuthController::class, 'updatePreferences']);
        Route::put('/user/password', [App\Http\Controllers\Api\V1\AuthController::class, 'changePassword']);
        Route::get('/user/export-data', [App\Http\Controllers\Api\V1\AuthController::class, 'exportData']);
        Route::delete('/user/account', [App\Http\Controllers\Api\V1\AuthController::class, 'deleteAccount']);
        Route::get('/user/notifications/counts', [App\Http\Controllers\Api\V1\NotificationController::class, 'counts']);

        // User WoW Characters
        Route::get('/user/wow-characters', [App\Http\Controllers\Api\V1\UserWowCharactersController::class, 'index']);
        Route::post('/user/wow-characters/{id}/set-main', [App\Http\Controllers\Api\V1\UserWowCharactersController::class, 'setMain']);
        Route::delete('/user/wow-characters/{id}', [App\Http\Controllers\Api\V1\UserWowCharactersController::class, 'destroy']);

        // Friends
        Route::get('/friends', [App\Http\Controllers\Api\V1\FriendController::class, 'index']);
        Route::get('/friends/pending', [App\Http\Controllers\Api\V1\FriendController::class, 'penndingRequests']);
        Route::get('/friends/search', [App\Http\Controllers\Api\V1\FriendController::class, 'search']);
        Route::post('/friends/request', [App\Http\Controllers\Api\V1\FriendController::class, 'sendRequest']);
        Route::post('/friends/block/{id}', [App\Http\Controllers\Api\V1\FriendController::class, 'block']);
        Route::post('/friends/accept/{id}', [App\Http\Controllers\Api\V1\FriendController::class, 'acceptRequest']);
        Route::post('/friends/decline/{id}', [App\Http\Controllers\Api\V1\FriendController::class, 'declineRequest']);

        // Messages
        Route::get('/messages', [App\Http\Controllers\Api\V1\MessageController::class, 'index']);
        Route::post('/messages', [App\Http\Controllers\Api\V1\MessageController::class, 'store']);
        Route::patch('/messages/{id}/read', [App\Http\Controllers\Api\V1\MessageController::class, 'markRead']);
        Route::delete('/messages/conversation/{userId}', [App\Http\Controllers\Api\V1\MessageController::class, 'deleteConversation']);
        Route::delete('/messages/{id}', [App\Http\Controllers\Api\V1\MessageController::class, 'destroy']);

        // Email Verification
        Route::post('/email/resend', [App\Http\Controllers\Api\V1\VerificationController::class, 'resend']);
        Route::get('/email/status', [App\Http\Controllers\Api\V1\VerificationController::class, 'status']);

        // Shop & PayPal
        Route::post('/shop/orders', [App\Http\Controllers\Api\V1\PayPalController::class, 'createOrder']);
        Route::post('/shop/orders/capture', [App\Http\Controllers\Api\V1\PayPalController::class, 'captureOrder']);
        Route::post('/shop/orders/cod', [App\Http\Controllers\Api\V1\ShopController::class, 'storeOrder']);

        // Subscriptions
        Route::post('/subscriptions/activate', [App\Http\Controllers\Api\V1\PayPalController::class, 'activateSubscription']);

        // Forum (Authenticated)
        Route::post('/forum/threads', [App\Http\Controllers\Api\V1\ForumController::class, 'createThread']);
        Route::post('/forum/threads/{slug}/posts', [App\Http\Controllers\Api\V1\ForumController::class, 'createPost']);
        Route::post('/forum/threads/{slug}/upvote', [App\Http\Controllers\Api\V1\ForumController::class, 'upvote']);
        Route::post('/forum/threads/{slug}/pin', [App\Http\Controllers\Api\V1\ForumController::class, 'pinThread']);
        Route::put('/forum/threads/{slug}/posts/{postId}', [App\Http\Controllers\Api\V1\ForumController::class, 'updatePost']);
        Route::delete('/forum/threads/{slug}/posts/{postId}', [App\Http\Controllers\Api\V1\ForumController::class, 'deletePost']);

        // Game Ratings (Auth)
        Route::get('/games/{slug}/ratings/my', [App\Http\Controllers\Api\V1\GameRatingController::class, 'my']);
        Route::post('/games/{slug}/ratings', [App\Http\Controllers\Api\V1\GameRatingController::class, 'upsert']);
        Route::delete('/games/{slug}/ratings', [App\Http\Controllers\Api\V1\GameRatingController::class, 'destroy']);

        // Support Plans
        Route::post('/support/create-plan', [App\Http\Controllers\Api\V1\SupportController::class, 'createPlan']);
        Route::post('/support/pledge', [App\Http\Controllers\Api\V1\SupportController::class, 'pledge']);
    });

    // Public Routes (High Rate Limit - 3000 per minute for production traffic)
    Route::middleware('throttle:3000,1')->group(function () {
        // Email Verification (Public - from email link)
        Route::get('/email/verify/{id}/{hash}', [App\Http\Controllers\Api\V1\VerificationController::class, 'verify'])
            ->name('verification.verify');

        // Newsletter (Rate limited to prevent email bombing)
        // 5 subscribes per 10 minutes per IP
        Route::middleware('throttle:5,10')->group(function () {
            Route::post('/newsletter/subscribe', [App\Http\Controllers\Api\V1\NewsletterController::class, 'subscribe']);
        });

        // Newsletter verification - separate limit (stricter)
        Route::middleware('throttle:5,60')->group(function () {
            Route::post('/newsletter/verify', [App\Http\Controllers\Api\V1\NewsletterController::class, 'verify']);
        });

        // Contact Form (Rate limited - 3 per 10 minutes to prevent spam)
        Route::middleware('throttle:3,10')->group(function () {
            Route::post('/contact', [App\Http\Controllers\Api\V1\ContactController::class, 'store']);
        });

        // Navigation
        Route::get('/navigation/tree', [App\Http\Controllers\Api\V1\NavigationController::class, 'index']);

        // Home
        Route::get('/home', [App\Http\Controllers\Api\V1\HomeController::class, 'index']);

        // Media Kit
        Route::get('/media-kit', [App\Http\Controllers\Api\V1\MediaKitController::class, 'index']);

        // Search
        Route::get('/search/articles', [App\Http\Controllers\Api\V1\SearchController::class, 'articles']);

        // News
        Route::get('/news', [App\Http\Controllers\Api\V1\NewsController::class, 'index']);
        Route::get('/news/trending', [App\Http\Controllers\Api\V1\NewsController::class, 'trending']);
        Route::get('/news/{slug}', [App\Http\Controllers\Api\V1\NewsController::class, 'show']);

        // Reviews
        Route::get('/reviews', [App\Http\Controllers\Api\V1\ReviewController::class, 'index']);
        Route::get('/reviews/{slug}', [App\Http\Controllers\Api\V1\ReviewController::class, 'show']);

        // Categories (General)
        Route::get('/categories/{slug}', [App\Http\Controllers\Api\V1\CategoryController::class, 'show']);

        // Forum
        Route::get('/forum/stats', [App\Http\Controllers\Api\V1\ForumController::class, 'stats']);
        Route::get('/forum/categories', [App\Http\Controllers\Api\V1\ForumController::class, 'categories']);
        Route::get('/forum/active', [App\Http\Controllers\Api\V1\ForumController::class, 'activeThreads']);
        Route::get('/forum/categories/{slug}', [App\Http\Controllers\Api\V1\ForumController::class, 'showCategory']);
        Route::get('/forum/threads/{slug}', [App\Http\Controllers\Api\V1\ForumController::class, 'showThread']);
        Route::get('/forum/search', [App\Http\Controllers\Api\V1\ForumController::class, 'search'])->middleware('throttle:30,1');

        // Videos
        Route::get('/videos', [App\Http\Controllers\Api\V1\VideoController::class, 'index']);
        Route::get('/videos/{slug}', [App\Http\Controllers\Api\V1\VideoController::class, 'show']);

        // Guides
        Route::get('/guides', [App\Http\Controllers\Api\V1\GuideController::class, 'index']);
        Route::get('/guides/{slug}', [App\Http\Controllers\Api\V1\GuideController::class, 'show']);

        // Tech / Hardware
        Route::get('/tech', [App\Http\Controllers\Api\V1\TechController::class, 'index']);
        Route::get('/tech/{slug}', [App\Http\Controllers\Api\V1\TechController::class, 'show']);


        // WoW Character Analyzer (Rate limited to 60 req/min to protect OpenAI costs)
        Route::middleware('throttle:60,1')->prefix('wow')->group(function () {
            Route::post('/analyze', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'analyze']);
            Route::get('/leaderboard', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'leaderboard']);
            Route::get('/recent', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'recent']);
            Route::get('/analysis/{id}', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'show']);
            Route::post('/analysis/{id}/share', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'share']);
            Route::get('/realms/{region}', [App\Http\Controllers\Api\V1\WowAnalyzerController::class, 'getRealms']);
        });

        // Shop
        Route::get('/shop/products', [App\Http\Controllers\Api\V1\ShopController::class, 'index']);
        Route::get('/shop/products/{slug}', [App\Http\Controllers\Api\V1\ShopController::class, 'show']);

        // Support (Public view)
        Route::get('/support/tiers', [App\Http\Controllers\Api\V1\SupportController::class, 'index']);

        // Site Settings (Public)
        Route::get('/settings', [App\Http\Controllers\Api\V1\SettingsController::class, 'index']);

        // Page SEO (Public)
        Route::get('/page-seo', [App\Http\Controllers\Api\V1\SettingsController::class, 'pageSeo']);
        Route::get('/page-seo/{path}', [App\Http\Controllers\Api\V1\SettingsController::class, 'pageSeoByPath'])->where('path', '.*');

        // Public Profile
        Route::get('/users/{username}', [App\Http\Controllers\Api\V1\AuthController::class, 'show']);

        // Redirects
        Route::get('/redirects', [App\Http\Controllers\Api\V1\RedirectController::class, 'index']);

        // Staff / About Us
        Route::get('/staff', [App\Http\Controllers\Api\V1\AboutController::class, 'index']);

        // Ads
        Route::get('/ads/{position}', [App\Http\Controllers\Api\V1\AdController::class, 'show']);
        Route::post('/ads/{id}/click', [App\Http\Controllers\Api\V1\AdController::class, 'click']);

        // Comments
        Route::get('/comments/{type}/{id}', [App\Http\Controllers\Api\V1\CommentController::class, 'index']);

        // Tracking
        Route::get('/articles/{slug}/views', [App\Http\Controllers\Api\V1\TrackingController::class, 'getViews']);
        Route::post('/articles/{slug}/view', [App\Http\Controllers\Api\V1\TrackingController::class, 'recordView']);
    });

    // Games (Rate limited - 60 per minute to prevent scraping)
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/games/calendar', [App\Http\Controllers\Api\V1\GameController::class, 'calendar']);
        Route::get('/games/crawled-slugs', [App\Http\Controllers\Api\V1\GameController::class, 'crawledSlugs']);
        Route::get('/games/hub/{type}/{value}', [App\Http\Controllers\Api\V1\GameRatingController::class, 'hub']);
        Route::get('/games', [App\Http\Controllers\Api\V1\GameController::class, 'index']);
        Route::get('/games/{slug}/screenshots', [App\Http\Controllers\Api\V1\GameController::class, 'screenshots']);
        Route::get('/games/{slug}/movies', [App\Http\Controllers\Api\V1\GameController::class, 'movies']);
        Route::get('/games/{slug}/series', [App\Http\Controllers\Api\V1\GameController::class, 'series']);
        Route::get('/games/{slug}/suggested', [App\Http\Controllers\Api\V1\GameController::class, 'suggested']);
        Route::get('/games/{slug}/additions', [App\Http\Controllers\Api\V1\GameController::class, 'additions']);
        Route::get('/games/{slug}/ratings', [App\Http\Controllers\Api\V1\GameRatingController::class, 'index']);
        Route::get('/games/{slug}', [App\Http\Controllers\Api\V1\GameController::class, 'show']);
    });

    // Rate-limited authenticated actions
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments', [App\Http\Controllers\Api\V1\CommentController::class, 'store']);
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments/{id}/vote', [App\Http\Controllers\Api\V1\CommentController::class, 'vote']);
    Route::middleware(['auth:sanctum', 'throttle:5,1'])->post('/reports', [App\Http\Controllers\Api\V1\ReportController::class, 'store']);

    // SEO Tools (Admin only)
    Route::middleware(['auth:sanctum'])->prefix('seo')->group(function () {
        Route::post('/suggest-links', [App\Http\Controllers\Api\V1\SeoController::class, 'suggestLinks']);
        Route::get('/orphan-pages', [App\Http\Controllers\Api\V1\SeoController::class, 'getOrphanPages']);
        Route::get('/articles/{article}/inbound-links', [App\Http\Controllers\Api\V1\SeoController::class, 'getInboundLinks']);
        Route::get('/articles/{article}/schemas', [App\Http\Controllers\Api\V1\SeoController::class, 'getSchemas']);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // GIVEAWAYS
    // ═══════════════════════════════════════════════════════════════════════

    // Public routes
    Route::get('/giveaways', [App\Http\Controllers\Api\V1\GiveawayController::class, 'index']);
    Route::get('/giveaways/{slug}', [App\Http\Controllers\Api\V1\GiveawayController::class, 'show']);
    Route::get('/giveaways/{slug}/leaderboard', [App\Http\Controllers\Api\V1\GiveawayController::class, 'leaderboard']);

    // Authenticated routes (rate-limited to prevent abuse)
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // Entry actions - stricter limits
        Route::middleware('throttle:10,1')->group(function () {
            Route::post('/giveaways/{slug}/enter', [App\Http\Controllers\Api\V1\GiveawayController::class, 'enter']);
            Route::post('/giveaways/{slug}/tasks/{taskId}/complete', [App\Http\Controllers\Api\V1\GiveawayController::class, 'completeTask']);
            Route::post('/giveaways/{slug}/daily-bonus', [App\Http\Controllers\Api\V1\GiveawayController::class, 'claimDailyBonus']);
        });

        // Read actions - more relaxed
        Route::get('/giveaways/{slug}/my-entry', [App\Http\Controllers\Api\V1\GiveawayController::class, 'myEntry']);
    });

    // Privee giveaway auth — separate from TechPlay auth (no sanctum required)
    Route::middleware('throttle:20,1')->prefix('giveaways/{slug}/privee')->group(function () {
        Route::post('/login', [App\Http\Controllers\Api\V1\PriveeGiveawayController::class, 'login']);
        Route::post('/google-login', [App\Http\Controllers\Api\V1\PriveeGiveawayController::class, 'googleLogin']);
        Route::get('/entry', [App\Http\Controllers\Api\V1\PriveeGiveawayController::class, 'myEntry']);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // WEBHOOKS (No Auth Required - External Services)
    // ═══════════════════════════════════════════════════════════════════════

    // PayPal Webhooks (Signature Verified Internally)
    Route::post('/webhooks/paypal', [App\Http\Controllers\Api\V1\PayPalWebhookController::class, 'handleWebhook']);

});
