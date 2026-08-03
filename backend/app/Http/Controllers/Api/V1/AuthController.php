<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\V1\PublicUserResource;
use App\Http\Resources\V1\UserResource;
use App\Models\Achievement;
use App\Models\ClanMember;
use App\Models\ConnectedAccount;
use App\Models\GameRating;
use App\Models\Order;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserGame;
use App\Services\AchievementService;
use App\Services\LevelService;
use App\Services\PremiumService;
use App\Services\ProfileService;
use App\Services\ReCaptchaService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    protected ReCaptchaService $recaptcha;

    public function __construct(ReCaptchaService $recaptcha)
    {
        $this->recaptcha = $recaptcha;
    }

    public function register(RegisterRequest $request)
    {
        // Validate reCAPTCHA/Turnstile token (can be disabled via TURNSTILE_ENABLED=false)
        if (config('services.turnstile.enabled', true)) {
            if (! $request->filled('recaptcha_token')) {
                return $this->error('Cloudflare Turnstile token is missing', 422);
            }

            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'register');
            if (! $captchaResult['success']) {
                return $this->error($captchaResult['error'] ?? 'Security check failed. Please refresh the page.', 422);
            }
        }

        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['username'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'], // Model's 'hashed' cast handles hashing
        ]);

        // Set role directly (not mass assignable for security)
        $user->role = 'user';
        $user->save();

        // Send email verification notification (don't block registration if this fails)
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            \Log::warning('Failed to send verification email: '.$e->getMessage());
        }

        // Create token to allow access to verification page
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->created([
            'user' => $user,
            'access_token' => $token,
            'requires_verification' => true,
        ], 'User registered successfully. Please verify your email.');
    }

    public function login(Request $request)
    {
        // Validate reCAPTCHA/Turnstile token (can be disabled via TURNSTILE_ENABLED=false)
        // Allow 'staff-bypass' token for maintenance mode staff access
        $bypassToken = $request->input('recaptcha_token') === 'staff-bypass';

        if (config('services.turnstile.enabled', true) && ! $bypassToken) {
            if (! $request->filled('recaptcha_token')) {
                throw ValidationException::withMessages([
                    'recaptcha' => ['Security check missing. Please refresh the page.'],
                ]);
            }

            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'login');
            if (! $captchaResult['success']) {
                throw ValidationException::withMessages([
                    'recaptcha' => [$captchaResult['error'] ?? 'Security check failed. Please refresh the page.'],
                ]);
            }
        }

        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        // Check email verification
        $requiresVerification = ! $user->hasVerifiedEmail();

        if ($requiresVerification) {
            return $this->success([
                'access_token' => null, // No token
                'requires_verification' => true,
            ], 'Please verify your email address.');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
            'requires_verification' => false,
        ], 'Login successful');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Refresh the current token.
     * Deletes the old token and issues a new one.
     */
    public function refresh(Request $request)
    {
        $user = $request->user();

        // Delete current token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $newToken = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'token' => $newToken,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 'Token refreshed successfully');
    }

    public function user(Request $request)
    {
        $user = $request->user()->makeVisible('email')->load('rank')->loadCount(['posts', 'threads']);

        $user->next_rank = $user->nextRank();

        return new UserResource($user);
    }

    public function show(string $username)
    {
        $viewer = Auth::user();
        $profileService = new ProfileService;

        $target = User::where('username', $username)->with('rank')->firstOrFail();
        $isOwner = $viewer !== null && $viewer->id === $target->id;

        // Viewer-specific and therefore never cached alongside the payload.
        $friendStatus = $profileService->friendStatus($target, $viewer);
        $canView = $isOwner || ! $target->hasPrivateProfile() || $friendStatus === 'accepted';

        // A locked profile is a doorway, not a dead end: identity + rank stay
        // visible so a stranger has a reason to send the friend request.
        if (! $canView) {
            return response()->json($this->buildLockedPayload($target) + ['friend_status' => $friendStatus]);
        }

        // Visitors share a short-lived cached payload (the build runs ~35+
        // queries); the owner always gets fresh data.
        $payload = $isOwner
            ? $this->buildProfilePayload($username)
            : Cache::remember('profile.show.v1.'.strtolower($username), 60, fn () => $this->buildProfilePayload($username));

        $payload['friend_status'] = $friendStatus;

        // Viewer-specific overlay — "given_by_me" recognition flags must never
        // come from the shared cache.
        if ($viewer !== null && ! $isOwner) {
            $payload['recognitions'] = $profileService->recognitions($target, $viewer->id);
        }

        return response()->json($payload);
    }

    /**
     * What a stranger sees of a friends-only profile: who you are and how far
     * you've come — nothing about what you own, play or wrote.
     */
    private function buildLockedPayload(User $user): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
                'cover_image' => $user->cover_image ? asset('storage/'.$user->cover_image) : null,
                'created_at' => $user->created_at,
                'xp' => $user->xp ?? 0,
                'rank' => $user->rank ? [
                    'name' => $user->rank->name,
                    'min_xp' => $user->rank->min_xp,
                    'color' => $user->rank->color,
                    'icon' => $user->rank->icon,
                ] : null,
            ],
            'stats' => [
                'level' => app(LevelService::class)->forXp($user->xp),
                'xp' => $user->xp ?? 0,
                'joined_at' => $user->created_at->format('M Y'),
            ],
            'is_private' => true,
            'can_view' => false,
        ];
    }

    private function buildProfilePayload(string $username): array
    {
        // PERFORMANCE: Use loadCount to avoid N+1 queries for counts
        $user = User::where('username', $username)
            ->with(['rank', 'activeSupport.tier', 'achievements'])
            ->withCount([
                'threads',
                'posts',
                'comments as approved_comments_count' => fn ($q) => $q->where('status', 'approved'),
                'articles as published_articles_count' => fn ($q) => $q->where('status', 'published'),
            ])
            ->firstOrFail();

        // Check if user is staff (admin, editor, moderator, journalist) - check BOTH Spatie AND DB column
        $isStaff = $user->hasRole(['admin', 'Admin', 'Super Admin', 'editor', 'Editor', 'Editor-in-Chief', 'moderator', 'Moderator', 'Journalist'])
            || in_array(strtolower($user->role ?? ''), ['admin', 'editor', 'moderator', 'journalist', 'super_admin']);

        // Fetch recent threads (only public data)
        $recentThreads = $user->threads()
            ->with('category:id,slug,name')
            ->latest()
            ->take(5)
            ->get(['id', 'title', 'slug', 'category_id', 'created_at', 'view_count']);

        // Fetch recent comments (only public data - no polymorphic to avoid data leak)
        $recentComments = $user->comments()
            ->where('status', 'approved')
            ->latest()
            ->take(5)
            ->get(['id', 'content', 'created_at', 'commentable_type', 'commentable_id']);

        // Fetch recent articles (always fetch - frontend decides if to display based on role)
        $recentArticles = $user->articles()
            ->where('status', 'published')
            ->latest('published_at')
            ->with('category:id,type,name')
            ->take(6)
            ->get(['id', 'title', 'slug', 'featured_image_url', 'excerpt', 'published_at', 'views', 'category_id'])
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'type' => $article->category?->type ?? 'news',
                    'featured_image' => $article->featured_image_url,
                    'excerpt' => $article->excerpt,
                    'published_at' => $article->published_at,
                    'views' => $article->views,
                ];
            });

        // PERFORMANCE: Use already-loaded achievements instead of N+1 queries
        // Build a map of user's unlocked achievements with their pivot data
        $userAchievementsMap = $user->achievements->keyBy('id')->map(fn ($a) => $a->pivot->unlocked_at);
        $userUnlockedIds = $userAchievementsMap->keys()->toArray();

        // Get all achievements (catalog cached 1h — it was loaded on every view)
        // and merge with user's unlocked status
        // v2: hidden entries (features that haven't shipped) stay out of the
        // catalog so the profile never advertises an unreachable trophy.
        $achievementCatalog = Cache::remember(
            'achievements.catalog.v2',
            3600,
            fn () => Achievement::where('is_hidden', false)->get()
        );
        $allAchievements = $achievementCatalog->map(function ($achievement) use ($userAchievementsMap) {
            $isUnlocked = $userAchievementsMap->has($achievement->id);

            return [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon_path' => $achievement->icon_path,
                'points' => $achievement->points,
                'is_unlocked' => $isUnlocked,
                'unlocked_at' => $isUnlocked ? $userAchievementsMap->get($achievement->id) : null,
            ];
        });

        $unlockedCount = count($userUnlockedIds);

        // Game collection aggregates (Phase 1)
        $profileService = new ProfileService;
        $collectionCounts = $profileService->collectionCounts($user);

        // Calculate Stats - PERFORMANCE: Use already-loaded counts from withCount()
        $stats = [
            'threads_count' => $user->threads_count,
            'posts_count' => $user->posts_count,
            'comments_count' => $user->approved_comments_count,
            'reputation' => $user->forum_reputation ?? 0,
            'joined_at' => $user->created_at->format('M Y'), // Only month/year
            'achievements_count' => $unlockedCount,
            'level' => app(LevelService::class)->forXp($user->xp),
            'xp' => $user->xp ?? 0,
            // Published game reviews — same definition as /me/dashboard, so the
            // hero deck reads the same number whoever is looking.
            'reviews_count' => GameRating::where('user_id', $user->id)->where('is_draft', false)->count(),
            'articles_count' => $isStaff ? $user->published_articles_count : 0,
            // Game collection counts (Phase 1).
            'games_count' => $collectionCounts['games_count'],
            'playing_count' => $collectionCounts['playing_count'],
            'backlog_count' => $collectionCounts['backlog_count'],
            'completed_count' => $collectionCounts['completed_count'],
            'wishlist_count' => $collectionCounts['wishlist_count'],
            'favorites_count' => $collectionCounts['favorites_count'],
            'dropped_count' => $collectionCounts['dropped_count'],
            // the shelf's "+N this month" — growth, not a total
            'games_added_this_month' => UserGame::where('user_id', $user->id)
                ->where('created_at', '>=', now()->startOfMonth())
                ->count(),
            'bounty_balance' => (int) ($user->bounty_balance ?? 0),
            // Hero deck — same five numbers the owner sees on their own page
            'hours_played' => $profileService->hoursPlayed($user),
            'friends_count' => count($profileService->friendIds($user)),
        ];

        $nextRank = $user->nextRank();

        return [
            'user' => (new PublicUserResource($user))->resolve(),
            'achievements' => $allAchievements,
            'next_rank' => $nextRank ? [
                'name' => $nextRank->name,
                'min_xp' => $nextRank->min_xp,
                'color' => $nextRank->color,
            ] : null,
            // The hero's presence dot. Only the live flag leaves the server —
            // never last_seen_at.
            'is_online' => Presence::where('user_id', $user->id)->where('is_active', true)->exists(),
            'is_private' => $user->hasPrivateProfile(),
            'can_view' => true,
            'recent_threads' => $recentThreads,
            'recent_comments' => $recentComments,
            'recent_articles' => $recentArticles, // For staff profiles
            'is_staff' => $isStaff,
            'stats' => $stats,
            // Phase 1 — game collection dashboard blocks
            'collection_snapshot' => $profileService->collectionSnapshot($user),
            'playing_now' => $profileService->playingNow($user),
            'showcase' => $profileService->showcase($user),
            'platforms_genres' => $platformsGenres = $profileService->platformsAndGenres($user),
            'gamer_dna' => $profileService->gamerDna($user, $platformsGenres),
            // Phase 2 — reputation, ranking, recognitions, milestones
            // (recognitions cached giver-agnostic; viewer overlay is applied in show())
            'reputation' => $profileService->reputation($user),
            'recognitions' => $profileService->recognitions($user, null),
            'milestones' => $profileService->milestones([
                'forum_posts' => $stats['posts_count'],
                'threads' => $stats['threads_count'],
                'wishlist' => $stats['wishlist_count'],
                'games' => $stats['games_count'],
                'reputation' => $stats['reputation'],
            ]),
            // Phase 4 — public custom lists
            'lists' => $profileService->publicLists($user),
            // Phase 5 — loyalty & customization
            'customization' => $profileService->customization($user),
            // Phase D — premium + streak
            'is_premium' => app(PremiumService::class)->isPremium($user),
            'premium_tier' => app(PremiumService::class)->tierName($user),
            'streak' => [
                'days' => $user->daily_streak ?? 0,
                'claimed_today' => $user->last_daily_claim && Carbon::parse($user->last_daily_claim)->isToday(),
            ],
            // V3 — which external accounts are linked (providers only, no tokens)
            'connected_accounts' => ConnectedAccount::where('user_id', $user->id)->pluck('provider')->values(),
            // Xbox public identity (gamertag + gamerscore) for the hero chip
            'xbox_profile' => (function () use ($user) {
                $xbox = ConnectedAccount::where('user_id', $user->id)
                    ->where('provider', 'xbox')
                    ->where('visibility', 'public')
                    ->first(['display_name', 'metadata']);

                return $xbox ? [
                    'gamertag' => $xbox->display_name,
                    'gamerscore' => (int) data_get($xbox->metadata, 'gamerscore', 0),
                ] : null;
            })(),
            // V3 — clan membership (public identity)
            'clan' => (function () use ($user) {
                $member = ClanMember::where('user_id', $user->id)
                    ->with('clan:id,name,slug,logo,tag')
                    ->first();

                return $member && $member->clan ? [
                    'name' => $member->clan->name,
                    'slug' => $member->clan->slug,
                    'tag' => $member->clan->tag,
                    'logo' => $member->clan->logo,
                    'role' => $member->role,
                ] : null;
            })(),
        ];
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio' => 'nullable|string|max:500',
            'display_name' => 'nullable|string|max:50', // Removed alpha_dash to allow spaces
            'location' => 'nullable|string|max:100',
            'tagline' => 'nullable|string|max:120',
            'playstyle_tags' => 'nullable|array',
            'playstyle_tags.*' => 'string|max:40',
            'gamertags' => 'nullable|array',
            'gamertags.steam' => 'nullable|string|max:255',
            'gamertags.epic' => 'nullable|string|max:255',
            'gamertags.psn' => 'nullable|string|max:255',
            'gamertags.xbox' => 'nullable|string|max:255',
            'gamertags.discord' => 'nullable|string|max:255',
            'pc_specs' => 'nullable|array',
            'pc_specs.cpu' => 'nullable|string|max:255',
            'pc_specs.gpu' => 'nullable|string|max:255',
            'pc_specs.ram' => 'nullable|string|max:255',
            'pc_specs.mobo' => 'nullable|string|max:255',
            'pc_specs.case' => 'nullable|string|max:255',
            'avatar' => 'nullable|image|max:2048', // 2MB Max
            'cover_image' => 'nullable|image|max:5120', // 5MB Max
            'profile_visibility' => 'nullable|in:public,friends',
        ]);

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = asset('storage/'.$path);
        }

        // Handle Cover Image Upload
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public');
            $user->cover_image = $path;
        }

        $user->update([
            'bio' => $validated['bio'] ?? $user->bio,
            'display_name' => $validated['display_name'] ?? $user->display_name,
            'location' => $validated['location'] ?? $user->location,
            'tagline' => $validated['tagline'] ?? $user->tagline,
            'playstyle_tags' => $validated['playstyle_tags'] ?? $user->playstyle_tags,
            'gamertags' => $validated['gamertags'] ?? $user->gamertags,
            'pc_specs' => $validated['pc_specs'] ?? $user->pc_specs,
            'profile_visibility' => $validated['profile_visibility'] ?? $user->profile_visibility ?? User::VISIBILITY_PUBLIC,
        ]);

        // Going private has to evict the shared visitor cache immediately,
        // otherwise the old public payload keeps serving for another minute.
        Cache::forget('profile.show.v1.'.strtolower($user->username));

        // …and drop off the public boards now rather than in five minutes.
        if ($user->wasChanged('profile_visibility')) {
            $weekKey = now()->format('o-\WW');
            foreach (['xp', 'reputation', 'collection', 'completions'] as $board) {
                Cache::forget("leaderboard:{$board}");
                Cache::forget("leaderboard:{$board}:week:{$weekKey}");
            }
        }

        // Gamer Tag / Multi-Platform / Battlestation had no trigger before this
        try {
            app(AchievementService::class)->check($user, ['gamertags', 'pc_specs']);
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()->load('rank'),
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'cookie_preferences' => 'required|array',
            'cookie_preferences.necessary' => 'required|boolean',
            'cookie_preferences.analytics' => 'required|boolean',
            'cookie_preferences.marketing' => 'required|boolean',
        ]);

        $user->update([
            'cookie_preferences' => $validated['cookie_preferences'],
        ]);

        return response()->json([
            'message' => 'Preferences updated successfully',
            'cookie_preferences' => $user->cookie_preferences,
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required',
            'new_password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->update([
            'password' => $request->new_password, // Model's 'hashed' cast handles hashing
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    public function exportData(Request $request)
    {
        $user = $request->user()->load(['rank', 'achievements']);

        $data = [
            'exported_at' => now()->toISOString(),
            'profile' => [
                'username' => $user->username,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'bio' => $user->bio,
                'xp' => $user->xp,
                'created_at' => $user->created_at,
                'gamertags' => $user->gamertags,
                'pc_specs' => $user->pc_specs,
            ],
            'forum' => [
                'threads_count' => $user->threads()->count(),
                'posts_count' => $user->posts()->count(),
            ],
            'orders' => Order::where('user_id', $user->id)
                ->select('id', 'total', 'status', 'created_at')
                ->get(),
            'achievements' => $user->achievements->map(fn ($a) => [
                'name' => $a->name,
                'description' => $a->description,
                'unlocked_at' => $a->pivot->created_at ?? null,
            ]),
        ];

        return response()->json($data)
            ->header('Content-Disposition', 'attachment; filename="techplay-data.json"')
            ->header('Content-Type', 'application/json');
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $id = $user->id;

        // Anonymize personal data
        $user->email = "deleted_{$id}@deleted.techplay.gg";
        $user->name = 'Deleted User';
        $user->username = "deleted_user_{$id}";
        $user->display_name = null;
        $user->bio = null;
        $user->avatar_url = null;
        $user->cover_image = null;
        $user->discord_id = null;
        $user->save();

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json(['message' => 'Account deleted.']);
    }
}
