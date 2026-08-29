<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\V1\PublicUserResource;
use App\Http\Resources\V1\UserResource;
use App\Models\Achievement;
use App\Models\ConnectedAccount;
use App\Models\GameRating;
use App\Models\Presence;
use App\Models\User;
use App\Models\UserCustomization;
use App\Models\UserGame;
use App\Services\AchievementService;
use App\Services\LevelService;
use App\Services\ProfileService;
use App\Services\ReCaptchaService;
use App\Services\TrophyCaseService;
use App\Services\UserDataExportService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

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

        // `users.role` is the legacy string column. It has no reader left —
        // panel access moved to the `view admin panel` permission on 28 Aug and
        // the public badge to Spatie on 29 Aug — and the column is NOT NULL
        // with a default of 'user', so writing it here said nothing the schema
        // was not already saying. One save fewer per registration.

        // Send email verification notification (don't block registration if this fails)
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            \Log::warning('Failed to send verification email: '.$e->getMessage());
        }

        // No token before the email is verified. login() already refuses one
        // to an unverified account, so issuing one here was the door around
        // that: register with a throwaway address, ignore the email, and drive
        // the whole economy — streak claims, redemptions, pledges — forever,
        // refreshing the token before it expired. The frontend never used it;
        // it reads requires_verification and sends the user to sign in.
        return $this->created([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'requires_verification' => true,
        ], 'User registered successfully. Please verify your email.');
    }

    public function login(Request $request)
    {
        // Validate reCAPTCHA/Turnstile token (can be disabled via TURNSTILE_ENABLED=false)
        // Staff bypass for maintenance windows. It used to be the literal
        // string 'staff-bypass' compiled into the app, which anyone could send.
        // Now it is a secret that has to be set deliberately, and is absent by
        // default — so there is no bypass unless someone configures one.
        $configuredBypass = config('services.turnstile.bypass_token');
        $bypassToken = filled($configuredBypass)
            && hash_equals((string) $configuredBypass, (string) $request->input('recaptcha_token', ''));

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

    /**
     * Revoke the token this request arrived on, if it arrived on one.
     *
     * Sanctum hands back a TransientToken when the caller is authenticated by
     * session rather than by a bearer token — anyone logged into /admin in the
     * same browser, for instance. TransientToken has no delete(), so calling it
     * unconditionally turned logout into a 500 for exactly those people.
     */
    private function revokeCurrentToken(Request $request): void
    {
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }

    public function logout(Request $request)
    {
        $this->revokeCurrentToken($request);

        // A session-authenticated caller has no token to revoke; the session
        // is what has to end.
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

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
        $this->revokeCurrentToken($request);

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
        // Public route — only the sanctum guard sees a bearer token.
        $viewer = Auth::guard('sanctum')->user() ?? Auth::user();
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

        // The wallet is the owner's business. The frontend only ever renders it
        // behind isOwnProfile, so shipping it to every visitor bought nothing
        // and handed a scraper a ranked list of whose account is worth taking.
        if (! $isOwner) {
            unset($payload['stats']['bounty_balance'], $payload['bounty_balance']);
        }

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
                'cover_image' => $user->coverImageUrl(),
                'created_at' => $user->created_at,
                'xp' => $user->xp ?? 0,
                // A bought frame is worn, not owned in private — the same
                // reasoning the rank insignia goes out under. It carries no
                // information about the shelf behind it.
                'frame' => UserCustomization::where('user_customizations.user_id', $user->id)
                    ->where('user_customizations.is_equipped', true)
                    ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
                    ->where('customizations.type', 'frame')
                    ->value('customizations.value'),
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
                /*
                 * Three totals, and no fourth.
                 *
                 * A private profile already publishes a level, a rank and the
                 * date somebody joined — measures of how much, carrying nothing
                 * about what. These are the same kind of fact: how many games,
                 * how many hours, how many badges. None of them names a title,
                 * a session or an opinion, which is what the setting is for.
                 *
                 * They are here because a doorway needs a reason to knock at
                 * it. "This profile is private" tells a visitor nothing about
                 * whether the person behind it is worth adding.
                 *
                 * The privacy copy in settings was updated in the same change:
                 * somebody choosing friends-only is told these stay visible,
                 * rather than finding out from a stranger's screenshot.
                 */
                'games_count' => UserGame::where('user_id', $user->id)->whereNot('status', 'wishlist')->count(),
                'hours_played' => (int) round((int) UserGame::where('user_id', $user->id)->sum('playtime_minutes') / 60),
                'achievements_count' => $user->achievements()->count(),
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
            || $user->isStaff();

        // recent_threads, recent_comments and recent_articles were built here
        // — three queries and a fifth of the response — and nothing has ever
        // rendered any of them. The profile's recent activity comes from
        // /users/{username}/activity, which the overview calls for itself; a
        // second source here only guaranteed the two could disagree.

        // PERFORMANCE: Use already-loaded achievements instead of N+1 queries
        // Build a map of user's unlocked achievements with their pivot data
        $userAchievementsMap = $user->achievements->keyBy('id')->map(fn ($a) => $a->pivot->unlocked_at);
        $userUnlockedIds = $userAchievementsMap->keys()->toArray();

        // One catalogue, cached an hour, shared with AchievementController.
        //
        // Both cached under this same key and they cached different queries —
        // this one filtered `is_hidden`, the tab's did not — so whichever ran
        // first that hour decided what the other saw. The tab lost every hidden
        // achievement, including ones the reader had already unlocked and is
        // meant to see, or the profile got the unfiltered set. One query now,
        // and each caller filters for itself: here, to what is unlocked, which
        // is the same rule the tab applies.
        $achievementCatalog = Cache::remember(
            'achievements.catalog.v2',
            3600,
            fn () => Achievement::all()
        );
        // The five most recent unlocks, which is exactly what the overview's
        // Achievement Spotlight draws.
        //
        // The whole catalogue used to travel — all sixty-six, descriptions and
        // all, most of them locked — and it was 56% of this response. The
        // Achievements tab does not read it either: it calls
        // /users/{username}/achievements for the full set. The headline number
        // stays in stats.achievements_count.
        $allAchievements = $achievementCatalog
            ->filter(fn ($achievement) => $userAchievementsMap->has($achievement->id))
            ->sortByDesc(fn ($achievement) => (string) $userAchievementsMap->get($achievement->id))
            ->take(5)
            ->map(fn ($achievement) => [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'icon_path' => $achievement->versionedIconPath(),
                'points' => $achievement->points,
                'is_unlocked' => true,
                'unlocked_at' => $userAchievementsMap->get($achievement->id),
            ])
            ->values();

        $unlockedCount = count($userUnlockedIds);

        // How many there are to unlock, counted the same way the Achievements
        // tab counts them: hidden ones stay out unless this reader has one.
        // The hero prints "16 / N" and was reading N off the `achievements`
        // array — which is the five most recent unlocks — so every visitor saw
        // "16 / 5".
        $visibleTotal = $achievementCatalog
            ->filter(fn ($achievement) => ! $achievement->is_hidden || $userAchievementsMap->has($achievement->id))
            ->count();

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
            'achievements_total' => $visibleTotal,
            'level' => app(LevelService::class)->forXp($user->xp),
            'xp' => $user->xp ?? 0,
            // Published game reviews — same definition as /me/dashboard, so the
            // hero deck reads the same number whoever is looking.
            'reviews_count' => GameRating::where('user_id', $user->id)->where('is_draft', false)->count(),
            'articles_count' => $isStaff ? $user->published_articles_count : 0,
            // Game collection counts (Phase 1).
            'games_count' => $collectionCounts['games_count'],
            'playing_count' => $collectionCounts['playing_count'],
            // Computed since `played` was introduced and never sent: the
            // library strip reads stats.played_count, got undefined, and drew
            // a hard 0 under "Played" for everyone. 185 of adi's 280 games and
            // 176 of XLBanana47's 396 sit in that bucket.
            'played_count' => $collectionCounts['played_count'],
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

        $presence = Presence::where('user_id', $user->id)->where('is_active', true)->first();

        return [
            'user' => (new PublicUserResource($user))->resolve() + [
                // Platform handles belong to a profile, not to every place a
                // PublicUserResource turns up — a comment author does not need
                // to carry somebody's PSN id — so they are merged in here
                // rather than added to the resource.
                //
                // The hero has mapped `user.gamertags` into platform chips
                // since it was written and neither profile endpoint sent the
                // key, so five accounts have handles saved that no page has
                // ever shown. Empty entries are dropped: a field cleared in
                // the admin panel should not mint a chip with no handle in it.
                'gamertags' => array_filter((array) ($user->gamertags ?? [])),
            ],
            'achievements' => $allAchievements,
            // The five the reader chose, from any source they have. Empty until
            // they arrange one — the page falls back to recent unlocks, so a
            // profile is never blank where the case would be.
            'trophy_case' => app(TrophyCaseService::class)->forUser($user),
            'next_rank' => $nextRank ? [
                'name' => $nextRank->name,
                'min_xp' => $nextRank->min_xp,
                'color' => $nextRank->color,
            ] : null,
            // The hero's presence dot, and what they are playing while it is
            // lit. Setting "Now Playing" wrote a row nothing ever read back:
            // the picker existed, the endpoint existed, and the game name went
            // nowhere. Still only the live row — never last_seen_at.
            'is_online' => $presence !== null,
            'presence' => $presence ? [
                'game_name' => $presence->game_name,
                'game_slug' => $presence->game_slug,
                'source' => $presence->source,
            ] : null,
            'is_private' => $user->hasPrivateProfile(),
            'can_view' => true,
            'is_staff' => $isStaff,
            'stats' => $stats,
            // Phase 1 — game collection dashboard blocks
            'collection_snapshot' => $profileService->collectionSnapshot($user),
            'playing_now' => $profileService->playingNow($user),
            'showcase' => $profileService->showcase($user),
            // Also the Collection tab's Platforms panel, which is why it
            // travels rather than staying a local: one aggregation, two
            // readers.
            'platforms_genres' => $profileService->platformsAndGenres($user),
            // How serious this person is, in four numbers. `gamer_dna` used to
            // sit here — a second copy of platforms/genres plus a favourites
            // query, computed on every public profile view and read by no
            // component on the site since the day it was added.
            'player_card' => $profileService->playerCard($user),
            // Phase 2 — reputation, ranking, recognitions
            // (recognitions cached giver-agnostic; viewer overlay is applied in show())
            // Where this player stands on the one ladder the site has.
            // Named `standing` because that is what it is now: it used to
            // carry a reputation tier ladder of its own, whose names
            // collided with the XP ranks four times over.
            'standing' => $profileService->reputation($user),
            'recognitions' => $profileService->recognitions($user, null),
            // Phase 4 — public custom lists
            'lists' => $profileService->publicLists($user),
            // Phase 5 — loyalty & customization
            'customization' => $profileService->customization($user),
            // The hero's flame. is_premium/premium_tier sat beside it and no
            // component has ever read either — the supporter state the profile
            // actually draws comes from customization.tier.
            'streak' => [
                'days' => $user->daily_streak ?? 0,
                'claimed_today' => $user->last_daily_claim && Carbon::parse($user->last_daily_claim)->isToday(),
            ],
            // V3 — which external accounts are linked (providers only, no tokens)
            'connected_accounts' => ConnectedAccount::where('user_id', $user->id)->pluck('provider')->values(),
            // Discord links through the users table rather than
            // connected_accounts, and being linked is not the same as being in
            // the server — the bot reports the second.
            'discord' => $user->discord_id ? [
                'member' => (bool) $user->discord_guild_member,
                'since' => $user->discord_guild_joined_at?->toIso8601String(),
            ] : null,
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
            'avatar' => 'nullable|image|max:2048', // 2MB Max
            'cover_image' => 'nullable|image|max:5120', // 5MB Max
            'remove_cover' => 'nullable|boolean',
            'profile_visibility' => 'nullable|in:public,friends',
            // Whether we may email this reader at all. The column has existed
            // since January and SendGiveawayReminders has been honouring it the
            // whole time; nothing ever let anybody set it.
            'email_notifications' => 'nullable|boolean',
            // May the site shelve a game because it saw you playing it? Default
            // on: without a library row there is nowhere to record the session.
            'auto_add_played_games' => 'nullable|boolean',
        ]);

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = asset('storage/'.$path);
        }

        // Handle Cover Image Upload
        // An explicit clear: the form sends remove_cover=1 when the reader
        // removes the image rather than replacing it.
        if ($request->boolean('remove_cover')) {
            $user->cover_image = null;
        }

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
            'profile_visibility' => $validated['profile_visibility'] ?? $user->profile_visibility ?? User::VISIBILITY_PUBLIC,
            'email_notifications' => $request->has('email_notifications')
                ? $request->boolean('email_notifications')
                : ($user->email_notifications ?? true),
            'auto_add_played_games' => $request->has('auto_add_played_games')
                ? $request->boolean('auto_add_played_games')
                : ($user->auto_add_played_games ?? true),
        ]);

        // Going private has to evict the shared visitor cache immediately,
        // otherwise the old public payload keeps serving for another minute.
        Cache::forget('profile.show.v1.'.strtolower($user->username));

        // …and drop off the public boards now rather than in five minutes.
        //
        // These used to forget "leaderboard:xp" and "leaderboard:xp:week:…",
        // keys nothing has ever written. LeaderboardController caches under
        // leaderboard.v2.{type}.{period}.{periodKey}, so going private cleared
        // nothing and the old public row kept being served for the full TTL.
        if ($user->wasChanged('profile_visibility')) {
            $periodKeys = [
                'all' => 'all',
                'month' => now()->format('Y-m'),
                'week' => now()->format('o-\WW'),
            ];

            foreach (['xp', 'reputation', 'collection', 'completions', 'reviews', 'achievements'] as $board) {
                foreach ($periodKeys as $period => $key) {
                    Cache::forget("leaderboard.v2.{$board}.{$period}.{$key}");
                    Cache::forget("leaderboard.v2.viewer.{$user->id}.{$board}.{$period}");
                }
            }

            Cache::forget('leaderboard.v2.rising');
        }

        // Gamer Tag / Multi-Platform / Battlestation had no trigger before this
        try {
            app(AchievementService::class)->check($user, ['gamertags', 'pc_specs']);
        } catch (\Throwable) {
        }

        // Answering with the raw model handed the client a path relative to the
        // public disk, where every read endpoint returns a url. The settings
        // page could not show what it had just saved.
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user->fresh()->load('rank')),
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

        // Every other session dies with the old password. Without this, a
        // token stolen beforehand kept working for its full seven days, so
        // changing the password gave the victim no way to evict an attacker.
        $currentTokenId = optional($request->user()->currentAccessToken())->id;

        $user->tokens()
            ->when($currentTokenId, fn ($q) => $q->where('id', '!=', $currentTokenId))
            ->delete();

        return response()->json([
            'message' => 'Password changed successfully. Other devices have been signed out.',
        ]);
    }

    /**
     * Everything we hold about this account, not a summary of it.
     *
     * This existed and was routed, which I missed on the first pass because I
     * grepped for "gdpr" and "data-export" and the method is called
     * exportData. What it returned, though, was eight profile fields, two
     * forum *counts*, orders and achievements — so a person exercising the
     * right to portability received a page and none of their collection, their
     * lists, their comments, their ratings, their messages or their linked
     * accounts.
     *
     * The work moved to UserDataExportService, where every one of the fifty
     * user-linked tables is named with a decision and a reason, and a test
     * fails when a new one appears unclassified. A list written once and
     * forgotten is how `gamertags` survived account deletion for months; this
     * is the same mistake avoided in the other direction.
     *
     * The URL does not change. Something may already be pointing at it.
     */
    public function exportData(Request $request, UserDataExportService $exporter)
    {
        $user = $request->user();
        $payload = $exporter->export($user);

        $name = 'techplay-'.($user->username ?: $user->id).'-'.now()->format('Y-m-d').'.json';

        // Streamed rather than built in memory: a collection of a few thousand
        // games with its sessions and ratings is not a response to hold whole.
        return response()->streamDownload(
            function () use ($payload) {
                echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            },
            $name,
            ['Content-Type' => 'application/json'],
        );
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $id = $user->id;

        // Irreversible, and previously reachable with nothing but a bearer
        // token — one leaked or XSS-exfiltrated token was the whole barrier.
        $request->validate(['current_password' => 'required']);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        /*
         * Where the uploads live, read before anything is cleared.
         *
         * The cleanup at the end of this method used `getOriginal()`, which it
         * reached only after `$user->save()` — and saving syncs the originals,
         * so by then the "original" avatar was the null that had just been
         * written. It has therefore never deleted a single file: not avatars,
         * not covers. Every deleted account left its portrait readable on the
         * public disk.
         *
         * An avatar is stored as `asset('storage/…')`, an absolute URL, while a
         * cover is stored relative — so both shapes are reduced to a disk path
         * here. An avatar taken from Discord's CDN has no `/storage/` in it and
         * is not ours to delete; it drops out as null.
         */
        $ownedFiles = collect([$user->avatar_url, $user->cover_image])
            ->filter()
            ->map(function (string $value): ?string {
                $path = str_contains($value, '/storage/') ? Str::after($value, '/storage/') : $value;

                return str_starts_with($path, 'http') ? null : $path;
            })
            ->filter()
            ->all();

        // Anonymize personal data
        $user->email = "deleted_{$id}@deleted.techplay.gg";
        $user->name = 'Deleted User';
        $user->username = "deleted_user_{$id}";
        $user->display_name = null;
        $user->bio = null;
        $user->avatar_url = null;
        $user->cover_image = null;
        $user->discord_id = null;

        // These all still named the person after "deletion": platform handles
        // on the public profile, hardware, location, the editorial byline.
        /*
         * Kolone se provjeravaju kroz getAttributes() jer ih cetiri ovdje
         * uopste ne postoje na tabeli — steam_id, psn_id, xbox_gamertag i
         * discord_username. Straza ih cini bezopasnim, ali je i sakrila da
         * `gamertags`, koja POSTOJI i drzi platformske nadimke, nije bila na
         * spisku: poslije "brisanja" naloga nadimci su ostajali u bazi.
         * Nadjeno u pregledu 28.08.2026, na sedam naloga.
         */
        foreach ([
            'gamertags',
            'steam_id', 'psn_id', 'xbox_gamertag', 'discord_username',
            'battlenet_id', 'battletag', 'battlenet_region', 'discord_avatar',
            // Ostaci veze s Discordom. discord_id se brisao, a ova dva su
            // ostajala — kad je clanstvo uslo i kad je zadnji put provjereno.
            'discord_guild_joined_at', 'discord_guild_checked_at',
            'pc_specs', 'location', 'tagline', 'author_slug', 'author_social_links',
        ] as $column) {
            if (array_key_exists($column, $user->getAttributes())) {
                $user->{$column} = null;
            }
        }

        // Ova je NOT NULL, pa se gasi a ne prazni. Prvi pokusaj ju je stavio u
        // istu petlju s ostalima i brisanje naloga je pocelo da vraca 500 —
        // uhvaceno testom prije nego je iko probao.
        if (array_key_exists('discord_guild_member', $user->getAttributes())) {
            $user->discord_guild_member = false;
        }

        $user->save();

        // The linked accounts carried the raw Steam64 / XUID and persona name,
        // and the public profile listed them.
        ConnectedAccount::where('user_id', $id)->delete();

        // The paths were taken before the columns were cleared — see above.
        foreach ($ownedFiles as $path) {
            Storage::disk('public')->delete($path);
        }

        /*
         * The open-letter signature carries its own copy of the address.
         *
         * `last_disc_signatures.email` is collected separately — the letter is
         * open to people who are not signed in — and its `user_id` is merely
         * `nullOnDelete`, which does nothing here because the account is
         * anonymised in place rather than deleted. So after "deletion" the real
         * address sat in that table beside a name and a country.
         *
         * Anonymised rather than removed, to match how the account itself is
         * treated: the signature counted toward a public tally and withdrawing
         * it silently would change a published number.
         */
        DB::table('last_disc_signatures')
            ->where('user_id', $id)
            ->update([
                'email' => "deleted_{$id}@deleted.techplay.gg",
                'name' => null,
                'display' => 'anonymous',
                'wants_updates' => false,
            ]);

        /*
         * The address and the browser string a giveaway entry recorded.
         *
         * Both were collected to catch somebody entering twice, and both are
         * personal data that outlives the reason for holding them the moment
         * the giveaway closes — let alone the moment the account is deleted.
         * The entry row itself stays: it is part of a draw that has a winner,
         * and removing it would change a result already announced.
         */
        DB::table('giveaway_entries')
            ->where('user_id', $id)
            ->update(['ip_address' => null, 'user_agent' => null]);

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json(['message' => 'Account deleted.']);
    }
}
