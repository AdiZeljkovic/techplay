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
        // Validate reCAPTCHA token if present (optional but recommended)
        if ($request->filled('recaptcha_token')) {
            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'register');
            if (!$captchaResult['success']) {
                return $this->error($captchaResult['error'] ?? 'reCAPTCHA verification failed', 422);
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

        // Do NOT create token yet - force login after verification
        // $token = $user->createToken('auth_token')->plainTextToken;

        return $this->created([
            'user' => $user,
            'access_token' => null, // No token until verified
            'requires_verification' => true,
        ], 'User registered successfully. Please verify your email.');
    }


    public function login(Request $request)
    {
        // Validate reCAPTCHA token
        if ($request->filled('recaptcha_token')) {
            $captchaResult = $this->recaptcha->verify($request->recaptcha_token, 'login');
            if (!$captchaResult['success']) {
                throw ValidationException::withMessages([
                    'recaptcha' => [$captchaResult['error'] ?? 'reCAPTCHA verification failed'],
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

    public function user(Request $request)
    {
        $user = $request->user()->load('rank')->loadCount('posts'); // Load stats

        $user->next_rank = $user->nextRank();
        return new \App\Http\Resources\V1\UserResource($user);
    }

    public function show(string $username)
    {
        $user = User::where('username', $username)
            ->with(['rank', 'activeSupport.tier'])
            ->firstOrFail();

        // Fetch recent threads
        $recentThreads = $user->threads()
            ->with('category')
            ->latest()
            ->take(5)
            ->get();

        // Fetch recent comments (activity)
        $recentComments = $user->comments()
            ->with('commentable') // Polymorphic relation
            ->latest()
            ->take(5)
            ->get();

        // Fetch all achievements
        $allAchievements = \App\Models\Achievement::all();
        // Fetch user's unlocked achievements as a collection keyed by achievement_id
        $userUnlockedMap = $user->achievements()->get()->keyBy('id');

        // Map to add status
        $processedAchievements = $allAchievements->map(function ($achievement) use ($userUnlockedMap) {
            $unlocked = $userUnlockedMap->has($achievement->id);
            $achievement->is_unlocked = $unlocked;
            $achievement->unlocked_at = $unlocked ? $userUnlockedMap->get($achievement->id)->pivot->unlocked_at : null;
            return $achievement;
        });

        // Calculate Stats
        $stats = [
            'threads_count' => $user->threads()->count(),
            'posts_count' => $user->posts()->count(), // Forum posts
            'comments_count' => $user->comments()->count(),
            'reputation' => $user->forum_reputation ?? 0, // Assuming column exists from earlier discussions
            'joined_at' => $user->created_at->format('M d, Y'),
            'xp' => $user->xp,
            'achievements_count' => $userUnlockedMap->count(),
            'level' => floor(($user->xp ?? 0) / 1000) + 1,
        ];

        return response()->json([
            'user' => [
                ...$user->toArray(),
                'achievements' => $processedAchievements,
            ],
            'next_rank' => $user->nextRank(),
            'recent_threads' => $recentThreads,
            'recent_comments' => $recentComments,
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
        ]);

        // Handle Avatar Upload
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = asset('storage/' . $path);
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
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}