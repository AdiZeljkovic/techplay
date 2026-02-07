<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReCaptchaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    use \App\Traits\ApiResponse;

    protected ReCaptchaService $recaptcha;

    public function __construct(ReCaptchaService $recaptcha)
    {
        $this->recaptcha = $recaptcha;
    }

    public function register(\App\Http\Requests\Auth\RegisterRequest $request)
    {
        // Validate reCAPTCHA/Turnstile token (can be disabled via TURNSTILE_ENABLED=false)
        if (config('services.turnstile.enabled', true)) {
            if (!$request->filled('recaptcha_token')) {
                return $this->error('Cloudflare Turnstile token is missing', 422);
            }

            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'register');
            if (!$captchaResult['success']) {
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
            \Log::warning('Failed to send verification email: ' . $e->getMessage());
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

        if (config('services.turnstile.enabled', true) && !$bypassToken) {
            if (!$request->filled('recaptcha_token')) {
                throw ValidationException::withMessages([
                    'recaptcha' => ['Security check missing. Please refresh the page.'],
                ]);
            }

            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'login');
            if (!$captchaResult['success']) {
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

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        // Check email verification
        $requiresVerification = !$user->hasVerifiedEmail();

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
            'user' => new \App\Http\Resources\V1\UserResource($user),
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
            'user' => new \App\Http\Resources\V1\UserResource($user),
        ], 'Token refreshed successfully');
    }

    public function user(Request $request)
    {
        $user = $request->user()->makeVisible('email')->load('rank')->loadCount(['posts', 'threads']);

        $user->next_rank = $user->nextRank();
        return new \App\Http\Resources\V1\UserResource($user);
    }

    public function show(string $username)
    {
        // PERFORMANCE: Use loadCount to avoid N+1 queries for counts
        $user = User::where('username', $username)
            ->with(['rank', 'activeSupport.tier', 'achievements'])
            ->withCount([
                'threads',
                'posts',
                'comments as approved_comments_count' => fn($q) => $q->where('status', 'approved'),
                'articles as published_articles_count' => fn($q) => $q->where('status', 'published'),
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
            ->take(6)
            ->get(['id', 'title', 'slug', 'featured_image_url', 'excerpt', 'published_at', 'views'])
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'type' => 'news',
                    'featured_image' => $article->featured_image_url,
                    'excerpt' => $article->excerpt,
                    'published_at' => $article->published_at,
                    'views' => $article->views,
                ];
            });

        // PERFORMANCE: Use already-loaded achievements instead of N+1 queries
        // Build a map of user's unlocked achievements with their pivot data
        $userAchievementsMap = $user->achievements->keyBy('id')->map(fn($a) => $a->pivot->unlocked_at);
        $userUnlockedIds = $userAchievementsMap->keys()->toArray();

        // Get all achievements and merge with user's unlocked status
        $allAchievements = \App\Models\Achievement::all()->map(function ($achievement) use ($userAchievementsMap) {
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

        // Calculate Stats - PERFORMANCE: Use already-loaded counts from withCount()
        $stats = [
            'threads_count' => $user->threads_count,
            'posts_count' => $user->posts_count,
            'comments_count' => $user->approved_comments_count,
            'reputation' => $user->forum_reputation ?? 0,
            'joined_at' => $user->created_at->format('M Y'), // Only month/year
            'achievements_count' => $unlockedCount,
            'level' => floor(($user->xp ?? 0) / 1000) + 1,
            'xp' => $user->xp ?? 0,
            'reviews_count' => $isStaff ? $user->published_articles_count : 0,
        ];

        return response()->json([
            'user' => new \App\Http\Resources\V1\PublicUserResource($user),
            'achievements' => $allAchievements,
            'next_rank' => $user->nextRank() ? [
                'name' => $user->nextRank()->name,
                'min_xp' => $user->nextRank()->min_xp,
            ] : null,
            'recent_threads' => $recentThreads,
            'recent_comments' => $recentComments,
            'recent_articles' => $recentArticles, // For staff profiles
            'is_staff' => $isStaff,
            'stats' => $stats
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio' => 'nullable|string|max:500',
            'display_name' => 'nullable|string|max:50', // Removed alpha_dash to allow spaces
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
        ]);

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = asset('storage/' . $path);
        }

        // Handle Cover Image Upload
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public');
            $user->cover_image = $path;
        }

        $user->update([
            'bio' => $validated['bio'] ?? $user->bio,
            'display_name' => $validated['display_name'] ?? $user->display_name,
            'gamertags' => $validated['gamertags'] ?? $user->gamertags,
            'pc_specs' => $validated['pc_specs'] ?? $user->pc_specs,
        ]);

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

        if (!Hash::check($request->current_password, $user->password)) {
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
}