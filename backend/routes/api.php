<?php

use App\Http\Controllers\Api\V1\AboutController;
use App\Http\Controllers\Api\V1\ActivityController;
use App\Http\Controllers\Api\V1\AdController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuthorController;
use App\Http\Controllers\Api\V1\BacklogAdvisorController;
use App\Http\Controllers\Api\V1\BattleNetAuthController;
use App\Http\Controllers\Api\V1\BountyController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ClanController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\ConnectedAccountController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CustomizationController;
use App\Http\Controllers\Api\V1\DiscordAdminController;
use App\Http\Controllers\Api\V1\DiscordDailyController;
use App\Http\Controllers\Api\V1\DiscordGiftController;
use App\Http\Controllers\Api\V1\DiscordIntegrationController;
use App\Http\Controllers\Api\V1\DiscordLeaderboardController;
use App\Http\Controllers\Api\V1\DiscordSubscriptionController;
use App\Http\Controllers\Api\V1\DiscordXpController;
use App\Http\Controllers\Api\V1\FeedController;
use App\Http\Controllers\Api\V1\ForumController;
use App\Http\Controllers\Api\V1\FriendActivityController;
use App\Http\Controllers\Api\V1\FriendController;
use App\Http\Controllers\Api\V1\GameCollectionController;
use App\Http\Controllers\Api\V1\GameController;
use App\Http\Controllers\Api\V1\GameListController;
use App\Http\Controllers\Api\V1\GameRatingController;
use App\Http\Controllers\Api\V1\GiveawayController;
use App\Http\Controllers\Api\V1\Gta6CharactersController;
use App\Http\Controllers\Api\V1\Gta6Controller;
use App\Http\Controllers\Api\V1\Gta6VehiclesController;
use App\Http\Controllers\Api\V1\Gta6WeaponsController;
use App\Http\Controllers\Api\V1\GuideController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\MediaKitController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\NavigationController;
use App\Http\Controllers\Api\V1\NewsController;
use App\Http\Controllers\Api\V1\NewsletterController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PayPalController;
use App\Http\Controllers\Api\V1\PayPalWebhookController;
use App\Http\Controllers\Api\V1\PresenceController;
use App\Http\Controllers\Api\V1\PriveeGiveawayController;
use App\Http\Controllers\Api\V1\ProfileCompareController;
use App\Http\Controllers\Api\V1\QuestController;
use App\Http\Controllers\Api\V1\RecognitionController;
use App\Http\Controllers\Api\V1\RedirectController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\RewardController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SeasonController;
use App\Http\Controllers\Api\V1\SeoController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\ShopController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use App\Http\Controllers\Api\V1\SteamAchievementController;
use App\Http\Controllers\Api\V1\StreakController;
use App\Http\Controllers\Api\V1\SupportController;
use App\Http\Controllers\Api\V1\SystemController;
use App\Http\Controllers\Api\V1\TechController;
use App\Http\Controllers\Api\V1\TrackingController;
use App\Http\Controllers\Api\V1\UserWowCharactersController;
use App\Http\Controllers\Api\V1\VerificationController;
use App\Http\Controllers\Api\V1\VideoController;
use App\Http\Controllers\Api\V1\WebhookController;
use App\Http\Controllers\Api\V1\WowAnalyzerController;
use App\Http\Controllers\Api\V1\WrappedController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // System Status (Public)
    Route::get('/system/status', [SystemController::class, 'status']);

    // Auth (Rate Limited - 60 per minute)
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);

        // Social Auth (Discord)
        Route::get('/auth/discord/redirect', [SocialAuthController::class, 'redirect']);
        Route::get('/auth/discord/callback', [SocialAuthController::class, 'callback']);

        // Social Auth (Battle.net)
        Route::get('/auth/battlenet/redirect', [BattleNetAuthController::class, 'redirect']);
        Route::get('/auth/battlenet/callback', [BattleNetAuthController::class, 'callback']);

        // Internal Webhooks (Secured by app logic/middleware typically, or local only)
        Route::post('/webhooks/discord/notify', [WebhookController::class, 'notify']);
    });

    // Discord Bot Integration (Bot-token authenticated, higher rate limit)
    // 300/min allows for active Discord servers while preventing abuse
    Route::middleware('throttle:300,1')->prefix('discord')->group(function () {
        // User & XP
        Route::get('/user/{discordId}', [DiscordIntegrationController::class, 'getUser']);
        Route::post('/xp', [DiscordXpController::class, 'addXp']);
        // Presence from Discord Rich Presence (bot reports game activity)
        Route::post('/presence', [PresenceController::class, 'discordUpdate']);
        Route::get('/leaderboard', [DiscordLeaderboardController::class, 'top']);
        Route::post('/daily', [DiscordDailyController::class, 'claim']);

        // Subscriptions (news/giveaway notifications)
        Route::get('/subscriptions', [DiscordSubscriptionController::class, 'index']);
        Route::post('/subscriptions', [DiscordSubscriptionController::class, 'subscribe']);
        Route::delete('/subscriptions', [DiscordSubscriptionController::class, 'unsubscribe']);

        // Gift XP
        Route::post('/gift', [DiscordGiftController::class, 'gift']);

        // Admin Operations
        Route::prefix('admin')->group(function () {
            Route::post('/xp/give', [DiscordAdminController::class, 'giveXp']);
            Route::post('/xp/remove', [DiscordAdminController::class, 'removeXp']);
            Route::post('/event', [DiscordAdminController::class, 'startEvent']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'user']);
        Route::put('/user/profile', [AuthController::class, 'updateProfile']);
        Route::put('/user/preferences', [AuthController::class, 'updatePreferences']);
        Route::put('/user/password', [AuthController::class, 'changePassword']);
        Route::get('/user/export-data', [AuthController::class, 'exportData']);
        Route::delete('/user/account', [AuthController::class, 'deleteAccount']);
        Route::get('/user/notifications/counts', [NotificationController::class, 'counts']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        // User WoW Characters
        Route::get('/user/wow-characters', [UserWowCharactersController::class, 'index']);
        Route::post('/user/wow-characters/{id}/set-main', [UserWowCharactersController::class, 'setMain']);
        Route::delete('/user/wow-characters/{id}', [UserWowCharactersController::class, 'destroy']);

        // Forum activity (own profile)
        Route::get('/user/watched-threads', [ForumController::class, 'myWatchedThreads']);
        Route::get('/user/bookmarked-threads', [ForumController::class, 'myBookmarkedThreads']);

        // Friends
        Route::get('/friends', [FriendController::class, 'index']);
        Route::get('/friends/pending', [FriendController::class, 'pendingRequests']);
        Route::get('/friends/search', [FriendController::class, 'search']);
        Route::post('/friends/request', [FriendController::class, 'sendRequest']);
        Route::post('/friends/block/{id}', [FriendController::class, 'block']);
        Route::post('/friends/accept/{id}', [FriendController::class, 'acceptRequest']);
        Route::post('/friends/decline/{id}', [FriendController::class, 'declineRequest']);

        // Messages
        Route::get('/messages', [MessageController::class, 'index']);
        Route::post('/messages', [MessageController::class, 'store']);
        Route::patch('/messages/{id}/read', [MessageController::class, 'markRead']);
        Route::delete('/messages/conversation/{userId}', [MessageController::class, 'deleteConversation']);
        Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

        // Email Verification
        Route::post('/email/resend', [VerificationController::class, 'resend']);
        Route::get('/email/status', [VerificationController::class, 'status']);

        // Shop & PayPal
        Route::post('/shop/orders', [PayPalController::class, 'createOrder']);
        Route::post('/shop/orders/capture', [PayPalController::class, 'captureOrder']);
        Route::post('/shop/orders/cod', [ShopController::class, 'storeOrder']);

        // Subscriptions
        Route::post('/subscriptions/activate', [PayPalController::class, 'activateSubscription']);

        // Forum (Authenticated)
        Route::middleware(['throttle:10,1', 'ban.check'])->post('/forum/threads', [ForumController::class, 'createThread']);
        Route::middleware(['throttle:20,1', 'ban.check'])->post('/forum/threads/{slug}/posts', [ForumController::class, 'createPost']);
        Route::middleware(['throttle:20,1', 'ban.check'])->post('/forum/threads/{slug}/upvote', [ForumController::class, 'upvote']);
        Route::post('/forum/threads/{slug}/pin', [ForumController::class, 'pinThread']);
        Route::middleware(['throttle:5,1', 'ban.check'])->post('/forum/threads/{slug}/self-pin', [ForumController::class, 'selfPinThread']);
        Route::post('/forum/threads/{slug}/lock', [ForumController::class, 'lockThread']);
        Route::delete('/forum/threads/{slug}', [ForumController::class, 'deleteThread']);
        Route::middleware(['throttle:20,1', 'ban.check'])->put('/forum/threads/{slug}/posts/{postId}', [ForumController::class, 'updatePost']);
        Route::middleware(['throttle:20,1', 'ban.check'])->delete('/forum/threads/{slug}/posts/{postId}', [ForumController::class, 'deletePost']);
        Route::middleware('throttle:20,1')->post('/forum/threads/{slug}/posts/{postId}/solution', [ForumController::class, 'markSolution']);
        Route::middleware('throttle:20,1')->post('/forum/threads/{slug}/watch', [ForumController::class, 'watchThread']);
        Route::middleware('throttle:20,1')->post('/forum/threads/{slug}/bookmark', [ForumController::class, 'bookmarkThread']);

        // Game Ratings (Auth)
        Route::get('/games/{slug}/ratings/my', [GameRatingController::class, 'my']);
        Route::middleware('throttle:30,1')->post('/games/{slug}/ratings', [GameRatingController::class, 'upsert']);
        Route::middleware('throttle:30,1')->delete('/games/{slug}/ratings', [GameRatingController::class, 'destroy']);

        // Game Collection (Auth) — the current user's library
        Route::get('/collection/games/{slug}', [GameCollectionController::class, 'show']);
        Route::middleware('throttle:60,1')->put('/collection/games/{slug}', [GameCollectionController::class, 'upsert']);
        Route::middleware('throttle:60,1')->delete('/collection/games/{slug}', [GameCollectionController::class, 'destroy']);

        // Presence (Auth) — set / clear what you're currently playing
        Route::post('/presence', [PresenceController::class, 'store']);
        Route::delete('/presence', [PresenceController::class, 'destroy']);

        // Library index — slug→status map for badge rendering
        Route::get('/collection/index', [GameCollectionController::class, 'libraryIndex']);

        // Upcoming releases from user's wishlist/backlog
        Route::get('/collection/upcoming', [GameCollectionController::class, 'upcoming']);

        // Personalized feed
        Route::get('/feed/personalized', [FeedController::class, 'personalized']);

        // AI Backlog Advisor
        Route::post('/backlog/suggest', [BacklogAdvisorController::class, 'suggest']);

        // Daily streak
        Route::get('/user/streak', [StreakController::class, 'show']);
        Route::post('/user/streak/claim', [StreakController::class, 'claim']);

        // Quests
        Route::get('/user/quests', [QuestController::class, 'index']);

        // Clans
        Route::get('/user/clan', [ClanController::class, 'myClan']);
        Route::post('/clans', [ClanController::class, 'store']);
        Route::post('/clans/{slug}/join', [ClanController::class, 'join']);
        Route::delete('/clans/{slug}/leave', [ClanController::class, 'leave']);
        Route::post('/clans/{slug}/invite', [ClanController::class, 'invite']);
        Route::post('/clans/invites/{id}/respond', [ClanController::class, 'respondInvite']);

        // Recognitions (Auth)
        Route::post('/users/{username}/recognitions', [RecognitionController::class, 'store']);
        Route::delete('/users/{username}/recognitions/{type}', [RecognitionController::class, 'destroy']);

        // Friend activity feed
        Route::get('/friends/activity', [FriendActivityController::class, 'index']);

        // Connected Accounts (Auth) — platform linking and library sync
        Route::prefix('connected-accounts')->group(function () {
            Route::get('/', [ConnectedAccountController::class, 'index']);
            Route::get('/steam/connect', [ConnectedAccountController::class, 'steamConnectUrl']);
            Route::post('/{id}/sync', [ConnectedAccountController::class, 'sync']);
            Route::delete('/{id}', [ConnectedAccountController::class, 'destroy']);
        });

        // Bounty + Rewards (Auth)
        Route::get('/bounty', [BountyController::class, 'index']);
        Route::get('/rewards/redemptions', [RewardController::class, 'redemptions']);
        Route::post('/rewards/{slug}/redeem', [RewardController::class, 'redeem']);

        // Loyalty & Customization (Auth)
        Route::get('/customizations', [CustomizationController::class, 'index']);
        Route::post('/customizations/{id}/acquire', [CustomizationController::class, 'acquire']);
        Route::post('/customizations/{id}/equip', [CustomizationController::class, 'equip']);
        Route::post('/customizations/{id}/unequip', [CustomizationController::class, 'unequip']);

        // Custom Game Lists (Auth)
        Route::get('/game-lists/mine', [GameListController::class, 'mine']);
        Route::middleware('throttle:60,1')->group(function () {
            Route::post('/game-lists', [GameListController::class, 'store']);
            Route::put('/game-lists/{id}', [GameListController::class, 'update']);
            Route::delete('/game-lists/{id}', [GameListController::class, 'destroy']);
            Route::post('/game-lists/{id}/items', [GameListController::class, 'addItem']);
            Route::delete('/game-lists/{id}/items/{itemId}', [GameListController::class, 'removeItem']);
            Route::put('/game-lists/{id}/reorder', [GameListController::class, 'reorder']);
        });

        // Support Plans
        Route::post('/support/create-plan', [SupportController::class, 'createPlan']);
        Route::post('/support/pledge', [SupportController::class, 'pledge']);
    });

    // Public Routes (High Rate Limit - 3000 per minute for production traffic)
    Route::middleware('throttle:3000,1')->group(function () {
        // Email Verification (Public - from email link)
        Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
            ->name('verification.verify');

        // Steam OpenID callback — public; user identity verified via short-lived token in URL
        Route::get('/connected-accounts/steam/callback', [ConnectedAccountController::class, 'steamCallback']);

        // Newsletter (Rate limited to prevent email bombing)
        // 5 subscribes per 10 minutes per IP
        Route::middleware('throttle:5,10')->group(function () {
            Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe']);
        });

        // Newsletter verification - separate limit (stricter)
        Route::middleware('throttle:5,60')->group(function () {
            Route::post('/newsletter/verify', [NewsletterController::class, 'verify']);
        });

        // Contact Form (Rate limited - 3 per 10 minutes to prevent spam)
        Route::middleware('throttle:3,10')->group(function () {
            Route::post('/contact', [ContactController::class, 'store']);
        });

        // Navigation
        Route::get('/navigation/tree', [NavigationController::class, 'index']);

        // Home
        Route::get('/home', [HomeController::class, 'index']);

        // Media Kit
        Route::get('/media-kit', [MediaKitController::class, 'index']);

        // Search
        Route::get('/search/articles', [SearchController::class, 'articles']);
        Route::get('/search/games', [SearchController::class, 'games']);

        // News
        Route::get('/news', [NewsController::class, 'index']);
        Route::get('/news/trending', [NewsController::class, 'trending']);
        Route::get('/news/{slug}', [NewsController::class, 'show']);

        // Reviews
        Route::get('/reviews', [ReviewController::class, 'index']);
        Route::get('/reviews/{slug}', [ReviewController::class, 'show']);

        // Categories (General)
        Route::get('/categories/{slug}', [CategoryController::class, 'show']);

        // Forum
        Route::get('/forum/stats', [ForumController::class, 'stats']);
        Route::get('/forum/categories', [ForumController::class, 'categories']);
        Route::get('/forum/active', [ForumController::class, 'activeThreads']);
        Route::get('/forum/unanswered', [ForumController::class, 'unansweredThreads']);
        Route::get('/forum/categories/{slug}', [ForumController::class, 'showCategory']);
        Route::get('/forum/threads/{slug}', [ForumController::class, 'showThread']);
        Route::get('/forum/search', [ForumController::class, 'search'])->middleware('throttle:30,1');

        // Videos
        Route::get('/videos', [VideoController::class, 'index']);
        Route::get('/videos/{slug}', [VideoController::class, 'show']);

        // Guides
        Route::get('/guides', [GuideController::class, 'index']);
        Route::get('/guides/{slug}', [GuideController::class, 'show']);

        // Tech / Hardware
        Route::get('/tech', [TechController::class, 'index']);
        Route::get('/tech/{slug}', [TechController::class, 'show']);

        // Global Leaderboards (cached 5 min, public)
        Route::get('/leaderboard', [LeaderboardController::class, 'index']);

        // Presence (Public) — profile page reads who's playing what
        Route::get('/presence/{username}', [PresenceController::class, 'show']);

        // WoW Character Analyzer (Rate limited to 60 req/min to protect OpenAI costs)
        Route::middleware('throttle:60,1')->prefix('wow')->group(function () {
            Route::post('/analyze', [WowAnalyzerController::class, 'analyze']);
            Route::get('/leaderboard', [WowAnalyzerController::class, 'leaderboard']);
            Route::get('/recent', [WowAnalyzerController::class, 'recent']);
            Route::get('/analysis/{id}', [WowAnalyzerController::class, 'show']);
            Route::post('/analysis/{id}/share', [WowAnalyzerController::class, 'share']);
            Route::get('/realms/{region}', [WowAnalyzerController::class, 'getRealms']);
        });

        // Shop
        Route::get('/shop/products', [ShopController::class, 'index']);
        Route::get('/shop/products/{slug}', [ShopController::class, 'show']);

        // Support (Public view)
        Route::get('/support/tiers', [SupportController::class, 'index']);

        // Site Settings (Public)
        Route::get('/settings', [SettingsController::class, 'index']);

        // Page SEO (Public)
        Route::get('/page-seo', [SettingsController::class, 'pageSeo']);
        Route::get('/page-seo/{path}', [SettingsController::class, 'pageSeoByPath'])->where('path', '.*');

        // Rewards store catalog (Public)
        Route::get('/rewards', [RewardController::class, 'index']);

        // Custom Game Lists (Public read)
        Route::get('/game-lists/{id}', [GameListController::class, 'show'])->whereNumber('id');

        // Seasons — public
        Route::get('/seasons', [SeasonController::class, 'index']);
        Route::get('/seasons/active', [SeasonController::class, 'active']);

        // Clans public
        Route::get('/clans', [ClanController::class, 'index']);
        Route::get('/clans/{slug}', [ClanController::class, 'show']);

        // Profile comparison
        Route::get('/compare/{username}/{other}', [ProfileCompareController::class, 'compare']);

        // Public Profile
        Route::get('/users/{username}/wrapped/{year}', [WrappedController::class, 'show']);
        Route::get('/users/{username}/collection', [GameCollectionController::class, 'index']);
        Route::get('/users/{username}/lists', [GameListController::class, 'index']);
        Route::get('/users/{username}/activity', [ActivityController::class, 'index']);
        Route::get('/users/{username}/recognitions', [RecognitionController::class, 'index']);
        Route::get('/users/{username}/steam-achievements', [SteamAchievementController::class, 'index']);
        Route::get('/users/{username}', [AuthController::class, 'show']);

        // Redirects
        Route::get('/redirects', [RedirectController::class, 'index']);

        // Staff / About Us
        Route::get('/staff', [AboutController::class, 'index']);

        // Author pages (public, editorial staff only)
        Route::get('/authors/{slug}', [AuthorController::class, 'show']);
        Route::get('/authors/{slug}/articles', [AuthorController::class, 'articles']);

        // GTA 6 Interactive Map (public)
        Route::prefix('gta6')->group(function () {
            Route::get('/locations', [Gta6Controller::class, 'locations']);
            Route::get('/categories', [Gta6Controller::class, 'categories']);

            // GTA 6 content databases (public, admin-curated)
            Route::get('/characters', [Gta6CharactersController::class, 'index']);
            Route::get('/characters/{slug}', [Gta6CharactersController::class, 'show']);

            Route::get('/vehicles', [Gta6VehiclesController::class, 'index']);
            Route::get('/vehicles/classes', [Gta6VehiclesController::class, 'classes']);
            Route::get('/vehicles/{slug}', [Gta6VehiclesController::class, 'show']);

            Route::get('/weapons', [Gta6WeaponsController::class, 'index']);
            Route::get('/weapons/types', [Gta6WeaponsController::class, 'types']);
            Route::get('/weapons/{slug}', [Gta6WeaponsController::class, 'show']);
        });

        // Ads
        Route::get('/ads/{position}', [AdController::class, 'show']);
        Route::post('/ads/{id}/click', [AdController::class, 'click']);

        // Comments
        Route::get('/comments/{type}/{id}', [CommentController::class, 'index']);

        // Tracking
        Route::get('/articles/{slug}/views', [TrackingController::class, 'getViews']);
        Route::post('/articles/{slug}/view', [TrackingController::class, 'recordView']);
    });

    // Games (Rate limited - 60 per minute to prevent scraping)
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/games/calendar', [GameController::class, 'calendar']);
        Route::get('/games/rawg/{slug}/screenshots', [GameController::class, 'rawgScreenshots']);
        Route::get('/games/rawg/{slug}/movies', [GameController::class, 'rawgMovies']);
        Route::get('/games/rawg/{slug}/suggested', [GameController::class, 'rawgSuggested']);
        Route::get('/games/rawg/{slug}/game-series', [GameController::class, 'rawgGameSeries']);
        Route::get('/games/rawg/{slug}', [GameController::class, 'rawgDetail']);
        Route::get('/games/crawled-slugs', [GameController::class, 'crawledSlugs']);
        Route::get('/games/random', [GameController::class, 'random']);
        Route::get('/games/hub/{type}/{value}', [GameRatingController::class, 'hub']);
        Route::get('/games', [GameController::class, 'index']);
        Route::get('/games/{slug}/articles', [GameController::class, 'articles']);
        Route::get('/games/{slug}/screenshots', [GameController::class, 'screenshots']);
        Route::get('/games/{slug}/movies', [GameController::class, 'movies']);
        Route::get('/games/{slug}/series', [GameController::class, 'series']);
        Route::get('/games/{slug}/suggested', [GameController::class, 'suggested']);
        Route::get('/games/{slug}/additions', [GameController::class, 'additions']);
        Route::get('/games/{slug}/ratings', [GameRatingController::class, 'index']);
        Route::get('/games/{slug}/threads', [ForumController::class, 'gameThreads']);
        Route::get('/games/{slug}', [GameController::class, 'show']);
    });

    // Rate-limited authenticated actions
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments', [CommentController::class, 'store']);
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments/{id}/vote', [CommentController::class, 'vote']);
    Route::middleware(['auth:sanctum', 'throttle:5,1'])->post('/reports', [ReportController::class, 'store']);

    // SEO Tools (Admin only)
    Route::middleware(['auth:sanctum'])->prefix('seo')->group(function () {
        Route::post('/suggest-links', [SeoController::class, 'suggestLinks']);
        Route::get('/orphan-pages', [SeoController::class, 'getOrphanPages']);
        Route::get('/articles/{article}/inbound-links', [SeoController::class, 'getInboundLinks']);
        Route::get('/articles/{article}/schemas', [SeoController::class, 'getSchemas']);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // GIVEAWAYS
    // ═══════════════════════════════════════════════════════════════════════

    // Public routes
    Route::get('/giveaways', [GiveawayController::class, 'index']);
    Route::get('/giveaways/{slug}', [GiveawayController::class, 'show']);
    Route::get('/giveaways/{slug}/leaderboard', [GiveawayController::class, 'leaderboard']);

    // Authenticated routes (rate-limited to prevent abuse)
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // Entry actions - stricter limits
        Route::middleware('throttle:10,1')->group(function () {
            Route::post('/giveaways/{slug}/enter', [GiveawayController::class, 'enter']);
            Route::post('/giveaways/{slug}/tasks/{taskId}/complete', [GiveawayController::class, 'completeTask']);
            Route::post('/giveaways/{slug}/daily-bonus', [GiveawayController::class, 'claimDailyBonus']);
        });

        // Read actions - more relaxed
        Route::get('/giveaways/{slug}/my-entry', [GiveawayController::class, 'myEntry']);
    });

    // Privee giveaway auth — separate from TechPlay auth (no sanctum required)
    Route::middleware('throttle:20,1')->prefix('giveaways/{slug}/privee')->group(function () {
        Route::post('/login', [PriveeGiveawayController::class, 'login']);
        Route::post('/google-login', [PriveeGiveawayController::class, 'googleLogin']);
        Route::get('/entry', [PriveeGiveawayController::class, 'myEntry']);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // WEBHOOKS (No Auth Required - External Services)
    // ═══════════════════════════════════════════════════════════════════════

    // PayPal Webhooks (Signature Verified Internally)
    Route::post('/webhooks/paypal', [PayPalWebhookController::class, 'handleWebhook']);

});
