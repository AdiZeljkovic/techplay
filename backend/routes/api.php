<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Auth (Relaxed Rate Limited - 60 per minute)
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/auth/register', [App\Http\Controllers\Api\V1\AuthController::class, 'register']);
        Route::post('/auth/login', [App\Http\Controllers\Api\V1\AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        // ... (routes unchanged)
    });

    // Public Routes (High Rate Limit - 3000 per minute for production traffic)
    Route::middleware('throttle:3000,1')->group(function () {
        // Email Verification (Public - from email link)
        Route::get('/email/verify/{id}/{hash}', [App\Http\Controllers\Api\V1\VerificationController::class, 'verify'])
            ->name('verification.verify');

        // Newsletter (Strict rate limit to prevent email bombing)
        Route::middleware('throttle:3,1')->group(function () {
            Route::post('/newsletter/subscribe', [App\Http\Controllers\Api\V1\NewsletterController::class, 'subscribe']);
            Route::post('/newsletter/verify', [App\Http\Controllers\Api\V1\NewsletterController::class, 'verify']);
        });

        // Navigation
        Route::get('/navigation/tree', [App\Http\Controllers\Api\V1\NavigationController::class, 'index']);

        // Home
        Route::get('/home', [App\Http\Controllers\Api\V1\HomeController::class, 'index']);

        // Search
        Route::get('/search/articles', [App\Http\Controllers\Api\V1\SearchController::class, 'articles']);

        // News
        Route::get('/news', [App\Http\Controllers\Api\V1\NewsController::class, 'index']);
        Route::get('/news/trending', [App\Http\Controllers\Api\V1\NewsController::class, 'trending']);
        Route::get('/news/{slug}', [App\Http\Controllers\Api\V1\NewsController::class, 'show']);

        // Reviews
        Route::get('/reviews', [App\Http\Controllers\Api\V1\ReviewController::class, 'index']);
        Route::get('/reviews/{slug}', [App\Http\Controllers\Api\V1\ReviewController::class, 'show']);

        // Forum
        Route::get('/forum/stats', [App\Http\Controllers\Api\V1\ForumController::class, 'stats']);
        Route::get('/forum/categories', [App\Http\Controllers\Api\V1\ForumController::class, 'categories']);
        Route::get('/forum/active', [App\Http\Controllers\Api\V1\ForumController::class, 'activeThreads']);
        Route::get('/forum/categories/{slug}', [App\Http\Controllers\Api\V1\ForumController::class, 'showCategory']);
        Route::get('/forum/threads/{slug}', [App\Http\Controllers\Api\V1\ForumController::class, 'showThread']);

        // Videos
        Route::get('/videos', [App\Http\Controllers\Api\V1\VideoController::class, 'index']);
        Route::get('/videos/{slug}', [App\Http\Controllers\Api\V1\VideoController::class, 'show']);

        // Guides
        Route::get('/guides', [App\Http\Controllers\Api\V1\GuideController::class, 'index']);
        Route::get('/guides/{slug}', [App\Http\Controllers\Api\V1\GuideController::class, 'show']);

        // Tech / Hardware
        Route::get('/tech', [App\Http\Controllers\Api\V1\TechController::class, 'index']);
        Route::get('/tech/{slug}', [App\Http\Controllers\Api\V1\TechController::class, 'show']);

        // Games (RAWG)
        Route::get('/games/calendar', [App\Http\Controllers\Api\V1\GameController::class, 'calendar']);
        Route::get('/games', [App\Http\Controllers\Api\V1\GameController::class, 'index']);
        Route::get('/games/{slug}', [App\Http\Controllers\Api\V1\GameController::class, 'show']);

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
        Route::post('/articles/{slug}/view', [App\Http\Controllers\Api\V1\TrackingController::class, 'recordView']);
    });

    // Rate-limited authenticated actions
    Route::middleware(['auth:sanctum', 'throttle:6,1'])->post('/comments', [App\Http\Controllers\Api\V1\CommentController::class, 'store']);
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments/{id}/vote', [App\Http\Controllers\Api\V1\CommentController::class, 'vote']);
    Route::middleware(['auth:sanctum', 'throttle:5,1'])->post('/reports', [App\Http\Controllers\Api\V1\ReportController::class, 'store']);

    // SEO Tools (Admin only)
    Route::middleware(['auth:sanctum'])->prefix('seo')->group(function () {
        Route::post('/suggest-links', [App\Http\Controllers\Api\V1\SeoController::class, 'suggestLinks']);
        Route::get('/orphan-pages', [App\Http\Controllers\Api\V1\SeoController::class, 'getOrphanPages']);
        Route::get('/articles/{article}/inbound-links', [App\Http\Controllers\Api\V1\SeoController::class, 'getInboundLinks']);
        Route::get('/articles/{article}/schemas', [App\Http\Controllers\Api\V1\SeoController::class, 'getSchemas']);
    });
});


