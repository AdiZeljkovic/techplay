<?php

use App\Http\Controllers\Api\V1\AboutController;
use App\Http\Controllers\Api\V1\AchievementController;
use App\Http\Controllers\Api\V1\ActivityController;
use App\Http\Controllers\Api\V1\AdController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuthorController;
use App\Http\Controllers\Api\V1\BacklogAdvisorController;
use App\Http\Controllers\Api\V1\BattleNetAuthController;
use App\Http\Controllers\Api\V1\BountyController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\ClanBaseController;
use App\Http\Controllers\Api\V1\ClanController;
use App\Http\Controllers\Api\V1\CollectionGoalController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\ConnectedAccountController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CustomizationController;
use App\Http\Controllers\Api\V1\DashboardController;
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
use App\Http\Controllers\Api\V1\GameHubController;
use App\Http\Controllers\Api\V1\GameListController;
use App\Http\Controllers\Api\V1\GameRatingController;
use App\Http\Controllers\Api\V1\GamerDnaController;
use App\Http\Controllers\Api\V1\GiveawayController;
use App\Http\Controllers\Api\V1\GiveawayHubController;
use App\Http\Controllers\Api\V1\Gta6CharactersController;
use App\Http\Controllers\Api\V1\Gta6Controller;
use App\Http\Controllers\Api\V1\Gta6VehiclesController;
use App\Http\Controllers\Api\V1\Gta6WeaponsController;
use App\Http\Controllers\Api\V1\GuideController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\JournalController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\MediaKitController;
use App\Http\Controllers\Api\V1\NavigationController;
use App\Http\Controllers\Api\V1\NewsController;
use App\Http\Controllers\Api\V1\NewsletterController;
use App\Http\Controllers\Api\V1\NewsroomController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PayPalController;
use App\Http\Controllers\Api\V1\PayPalWebhookController;
use App\Http\Controllers\Api\V1\PresenceController;
use App\Http\Controllers\Api\V1\QuestController;
use App\Http\Controllers\Api\V1\ReadingController;
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
use App\Http\Controllers\Api\V1\WebhookController;
use App\Http\Controllers\Api\V1\WowAnalyzerController;
use App\Http\Controllers\Api\V1\WrappedController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // System Status (Public)
    Route::get('/system/status', [SystemController::class, 'status']);
    Route::get('/system/health', [SystemController::class, 'health']);

    // Auth (Rate Limited - 60 per minute)
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);

        // Social Auth (Discord)
        Route::post('/email/resend-public', [VerificationController::class, 'resendPublic'])
            ->middleware('throttle:5,10');
        Route::get('/auth/discord/redirect', [SocialAuthController::class, 'redirect']);
        Route::get('/auth/discord/callback', [SocialAuthController::class, 'callback']);

        // Social Auth (Battle.net)
        Route::get('/auth/battlenet/redirect', [BattleNetAuthController::class, 'redirect']);
        Route::get('/auth/battlenet/callback', [BattleNetAuthController::class, 'callback']);

        // (The Discord relay used to sit here, unauthenticated — moved down to
        // the staff block, since it posts as TechPlay in the community channel.)
    });

    // Discord Bot Integration (Bot-token authenticated, higher rate limit)
    // 300/min allows for active Discord servers while preventing abuse
    // The bot-token check lives on the group, not in each controller. It was
    // copy-pasted per endpoint before, and the copies that were never written
    // left /discord/presence and /discord/user open to anyone.
    Route::middleware(['throttle:300,1', 'discord.bot'])->prefix('discord')->group(function () {
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
        // Social Hub — one chat system for direct, group and clan rooms
        Route::get('/social', [ChatController::class, 'hub']);
        Route::get('/conversations', [ChatController::class, 'index']);
        Route::post('/conversations', [ChatController::class, 'store']);
        Route::get('/conversations/clan', [ChatController::class, 'clanRoom']);
        Route::get('/conversations/{conversation}/messages', [ChatController::class, 'messages']);
        Route::post('/conversations/{conversation}/messages', [ChatController::class, 'send']);
        Route::post('/conversations/{conversation}/read', [ChatController::class, 'markRead']);
        Route::post('/conversations/{conversation}/participants', [ChatController::class, 'addParticipants']);
        Route::delete('/conversations/{conversation}/leave', [ChatController::class, 'leave']);
        Route::post('/messages/{message}/react', [ChatController::class, 'react']);

        // The legacy mail system is gone: conversations replaced it, no screen
        // reads it, and its index() matched on sender_id — which also matched
        // conversation rows, leaking Social Hub and clan-room messages back
        // through a shape nobody maintains.
        //   Route::get('/messages', ...)  — removed 08.08.2026

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
        Route::middleware('throttle:60,1')->post('/collection/games/{slug}/showcase', [GameCollectionController::class, 'toggleShowcase']);
        Route::middleware('throttle:5,1')->post('/collection/import', [GameCollectionController::class, 'import']);

        // Presence (Auth) — set / clear what you're currently playing
        Route::post('/presence', [PresenceController::class, 'store']);
        Route::delete('/presence', [PresenceController::class, 'destroy']);

        // Library index — slug→status map for badge rendering
        Route::get('/collection/index', [GameCollectionController::class, 'libraryIndex']);

        // Upcoming releases from user's wishlist/backlog
        Route::get('/collection/upcoming', [GameCollectionController::class, 'upcoming']);
        Route::post('/calendar/{slug}/reminder', [CalendarController::class, 'toggleReminder']);

        // Collection goals (targets are yours to set; progress is read live)
        Route::put('/me/collection-goals', [CollectionGoalController::class, 'update']);

        // Personalized feed
        Route::get('/feed/personalized', [FeedController::class, 'personalized']);

        // Logged-in homepage dashboard (aggregated read-only payload)
        Route::get('/me/dashboard', [DashboardController::class, 'index']);
        Route::get('/me/recommendations', [DashboardController::class, 'recommendations']);
        Route::get('/me/upcoming', [DashboardController::class, 'upcoming']);

        // Reading list, progress and search history
        Route::get('/me/reading', [ReadingController::class, 'index']);
        Route::post('/articles/{slug}/bookmark', [ReadingController::class, 'toggleBookmark'])->middleware('throttle:60,1');
        Route::put('/articles/{slug}/progress', [ReadingController::class, 'updateProgress'])->middleware('throttle:120,1');

        // AI Backlog Advisor
        Route::get('/backlog/recommendations', [BacklogAdvisorController::class, 'recommendations']);
        Route::post('/backlog/suggest', [BacklogAdvisorController::class, 'suggest']);

        // Daily streak
        Route::get('/user/streak', [StreakController::class, 'show']);
        Route::post('/user/streak/claim', [StreakController::class, 'claim']);

        // Quests
        Route::get('/user/quests', [QuestController::class, 'index']);

        // Clans
        Route::get('/user/clan', [ClanController::class, 'myClan']);
        Route::get('/user/clan-invites', [ClanController::class, 'myInvites']);
        Route::post('/clans', [ClanController::class, 'store']);
        Route::post('/clans/{slug}/join', [ClanController::class, 'join']);
        Route::delete('/clans/{slug}/leave', [ClanController::class, 'leave']);
        Route::post('/clans/{slug}/invite', [ClanController::class, 'invite']);
        Route::post('/clans/invites/{id}/respond', [ClanController::class, 'respondInvite']);
        Route::put('/clans/{slug}', [ClanController::class, 'update']);
        Route::post('/clans/{slug}/media', [ClanController::class, 'uploadMedia']);
        Route::delete('/clans/{slug}/media/{type}', [ClanController::class, 'deleteMedia']);
        Route::post('/clans/{slug}/apply', [ClanController::class, 'apply']);
        Route::get('/clans/{slug}/applications', [ClanController::class, 'applications']);
        Route::post('/clans/applications/{id}/respond', [ClanController::class, 'respondApplication']);
        Route::get('/clans/{slug}/base', [ClanBaseController::class, 'show']);
        Route::post('/clans/{slug}/base/projects', [ClanBaseController::class, 'startProject']);
        Route::post('/clans/{slug}/base/projects/{project}/fund', [ClanBaseController::class, 'fund']);
        Route::post('/clans/{slug}/base/projects/{project}/speed-up', [ClanBaseController::class, 'speedUp']);
        Route::delete('/clans/{slug}/base/projects/{project}', [ClanBaseController::class, 'cancel']);
        Route::post('/clans/{slug}/base/boosts', [ClanBaseController::class, 'activateBoost']);
        Route::post('/clans/{slug}/base/theme', [ClanBaseController::class, 'equipTheme']);
        Route::post('/clans/{slug}/base/polls', [ClanBaseController::class, 'createPoll']);
        Route::post('/clans/polls/{poll}/vote', [ClanBaseController::class, 'vote']);

        // Recognitions (Auth)
        Route::post('/users/{username}/recognitions', [RecognitionController::class, 'store']);
        Route::delete('/users/{username}/recognitions/{type}', [RecognitionController::class, 'destroy']);

        // Friend activity feed
        Route::get('/friends/activity', [FriendActivityController::class, 'index']);

        // Connected Accounts (Auth) — platform linking and library sync
        Route::prefix('connected-accounts')->group(function () {
            Route::get('/', [ConnectedAccountController::class, 'index']);
            Route::get('/steam/connect', [ConnectedAccountController::class, 'steamConnectUrl']);
            Route::middleware('throttle:10,1')->post('/xbox/connect', [ConnectedAccountController::class, 'xboxConnect']);
            Route::post('/{id}/sync', [ConnectedAccountController::class, 'sync']);
            Route::delete('/{id}', [ConnectedAccountController::class, 'destroy']);
        });

        // Bounty + Rewards (Auth)
        Route::post('/journal/sessions', [JournalController::class, 'store']);
        Route::put('/journal/sessions/{session}', [JournalController::class, 'update']);
        Route::delete('/journal/sessions/{session}', [JournalController::class, 'destroy']);
        Route::post('/journal/sessions/{session}/moments', [JournalController::class, 'addMoment']);
        Route::delete('/journal/moments/{moment}', [JournalController::class, 'deleteMoment']);
        Route::get('/bounty', [BountyController::class, 'index']);
        Route::get('/rewards/catalog', [RewardController::class, 'catalog']);
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
            Route::put('/game-lists/{id}/items/{itemId}', [GameListController::class, 'updateItem']);
            Route::post('/game-lists/{id}/like', [GameListController::class, 'toggleLike']);
            Route::post('/game-lists/{id}/comments', [GameListController::class, 'addComment']);
            Route::delete('/game-lists/{id}/comments/{commentId}', [GameListController::class, 'deleteComment']);
        });

        // Support Plans
        // (create-plan removed: it pointed at a SupportController method that
        // was never written, so every call 500'd. No frontend caller existed.)
        Route::post('/support/pledge', [SupportController::class, 'pledge']);
        Route::get('/support/mine', [SupportController::class, 'mySupport']);
    });

    // Public Routes (High Rate Limit - 3000 per minute for production traffic)
    Route::middleware('throttle:3000,1')->group(function () {
        // Email Verification (Public - from email link)
        Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
            ->middleware('signed')
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
        Route::get('/search/users', [SearchController::class, 'users']);

        // Latest across the editorial sections, for the dashboard strip
        Route::get('/feed/latest', [FeedController::class, 'latest']);
        Route::get('/feed/recommended-news', [FeedController::class, 'recommendedNews']);

        // News
        // One endpoint for news, reviews and tech — they are the same model
        // told apart by their category's type.
        Route::get('/newsroom/{section}', [NewsroomController::class, 'index']);
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
        Route::get('/game-lists/discover', [GameListController::class, 'discover']);
        Route::get('/game-lists/{id}', [GameListController::class, 'show'])->whereNumber('id');
        Route::get('/game-lists/{id}/comments', [GameListController::class, 'comments'])->whereNumber('id');

        // Seasons — public
        Route::get('/seasons', [SeasonController::class, 'index']);
        Route::get('/seasons/active', [SeasonController::class, 'active']);

        // Clans public
        Route::get('/clans', [ClanController::class, 'index']);
        Route::get('/clans/{slug}', [ClanController::class, 'show']);

        // Profile comparison

        // Public Profile
        Route::get('/users/{username}/wrapped/{year}', [WrappedController::class, 'show']);
        Route::get('/users/{username}/collection', [GameCollectionController::class, 'index']);
        Route::get('/users/{username}/collection-goals', [CollectionGoalController::class, 'index']);
        Route::get('/users/{username}/achievements', [AchievementController::class, 'index']);
        Route::get('/users/{username}/gamer-dna', [GamerDnaController::class, 'show']);
        Route::get('/users/{username}/journal', [JournalController::class, 'index']);
        Route::get('/users/{username}/lists', [GameListController::class, 'index']);
        Route::get('/users/{username}/lists/{slug}', [GameListController::class, 'showBySlug']);
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

        // Funnel analytics (auth-only, whitelisted events, aggregate counters)
        Route::post('/track/event', [TrackingController::class, 'recordEvent'])
            ->middleware(['auth:sanctum', 'throttle:30,1']);
    });

    // Games — the named 'api' limiter: 60/min per visitor against scraping,
    // but our own SSR process (X-Internal-Token) is exempt. A fixed
    // throttle:60,1 here made every server render on the site share one
    // visitor's budget, which is where the intermittent 404s came from.
    Route::middleware('throttle:api')->group(function () {
        Route::get('/calendar', [CalendarController::class, 'index']);
        Route::get('/calendar/{slug}', [CalendarController::class, 'show']);
        Route::get('/games/hub', [GameHubController::class, 'index']);
        Route::get('/games/calendar', [GameController::class, 'calendar']);
        Route::get('/games/hidden-gems', [GameController::class, 'hiddenGems']);
        Route::get('/games/on-this-day', [GameController::class, 'onThisDay']);
        Route::get('/games/random', [GameController::class, 'random']);
        Route::get('/games/hub/{type}/{value}', [GameRatingController::class, 'hub']);
        Route::get('/games', [GameController::class, 'index']);
        Route::get('/games/{slug}/articles', [GameController::class, 'articles']);
        Route::get('/games/{slug}/screenshots', [GameController::class, 'screenshots']);
        Route::get('/games/{slug}/videos', [GameController::class, 'videos']);
        Route::get('/games/{slug}/series', [GameController::class, 'series']);
        Route::get('/games/{slug}/suggested', [GameController::class, 'suggested']);
        Route::get('/games/{slug}/ratings', [GameRatingController::class, 'index']);
        Route::get('/games/{slug}/threads', [ForumController::class, 'gameThreads']);
        Route::get('/games/{slug}', [GameController::class, 'show']);
    });

    // Rate-limited authenticated actions
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments', [CommentController::class, 'store']);
    Route::middleware(['auth:sanctum', 'throttle:30,1'])->post('/comments/{id}/vote', [CommentController::class, 'vote']);
    Route::middleware(['auth:sanctum', 'throttle:5,1'])->post('/reports', [ReportController::class, 'store']);

    // Journal screenshots — same signed-URL treatment as DM attachments.
    Route::get('/journal/moments/{moment}/image', [JournalController::class, 'momentImage'])
        ->middleware('signed')
        ->name('journal.moment.image');

    // DM attachments — signed rather than auth'd, because an <img> tag cannot
    // send a bearer token. The signature expires; the file is off the public disk.
    Route::get('/chat/attachments/{message}', [ChatController::class, 'attachment'])
        ->middleware('signed')
        ->name('chat.attachment');

    // Manual Discord announcement relay (staff check inside the controller)
    Route::middleware(['auth:sanctum', 'throttle:10,1'])
        ->post('/webhooks/discord/notify', [WebhookController::class, 'notify']);

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
    Route::get('/giveaways/hub', [GiveawayHubController::class, 'index']);
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

    // ═══════════════════════════════════════════════════════════════════════
    // WEBHOOKS (No Auth Required - External Services)
    // ═══════════════════════════════════════════════════════════════════════

    // PayPal Webhooks (Signature Verified Internally)
    Route::post('/webhooks/paypal', [PayPalWebhookController::class, 'handleWebhook']);

});
