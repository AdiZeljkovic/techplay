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

        // Send email verification notification
        $user->sendEmailVerificationNotification();

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->created([
            'user' => $user,
            'access_token' => $token,
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new \App\Http\Resources\V1\UserResource($user),
            'requires_verification' => $requiresVerification,
        ], 'Login successful');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    public function user(Request $request)
    {
        $user = $request->user()->load('rank');
        // next_rank is not in UserResource by default, maybe we should add it?
        // Or keep it appended? UserResource doesn't accept 'additional' easily unless using collection?
        // Actually, JsonResource can accept ->additional().
        // But simpler: just append key to array in Resource?
        // UserResource defines toArray. 
        // Let's modify UserResource later if needed, but for now we might lose next_rank if not careful.
        // The original code: $user->next_rank = ...; return json($user);
        // If I do `return new UserResource($user);` creates response from toArray().
        // Does toArray() include dynamically added properties? $this->next_rank? 
        // No, $this inside Resource is the model. Dynamic props on model valid.
        // So I need to ensure UserResource's toArray includes dynamic props or specifically 'next_rank'.

        $user->next_rank = $user->nextRank();
        return (new \App\Http\Resources\V1\UserResource($user))->additional([
            'next_rank' => $user->next_rank // Explicitly pass it? Or just let resource handle it if I update resource
        ]);

        // Actually, simpler: I will update UserResource to include next_rank if it exists on model.
        // For now, let's just return resource, risking next_rank loss initially, 
        // but I will add $this->when($this->next_rank, ...) in UserResource in next step to fix it robustly.
        return new \App\Http\Resources\V1\UserResource($user);
    }

    public function show(string $username)
    {
        $user = User::where('username', $username)
            ->with(['rank', 'activeSupport.tier'])
            ->with([
                'articles' => function ($query) {
                    $query->where('status', 'published')->latest()->take(5);
                }
            ])
            ->firstOrFail();

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

        return response()->json([
            'user' => [
                ...$user->toArray(),
                'achievements' => $processedAchievements,
            ],
            'next_rank' => $user->nextRank(),
            'stats' => [
                'reviews_count' => $user->articles()->where('status', 'published')->count(),
                'joined_at' => $user->created_at->format('M d, Y'),
                'xp' => $user->xp,
                'achievements_count' => $userUnlockedMap->count(),
                'level' => floor(($user->xp ?? 0) / 1000) + 1,
            ]
        ]);
    }
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio' => 'nullable|string|max:500',
            'display_name' => 'nullable|string|max:50|alpha_dash', // Limit length
            'gamertags' => 'nullable|array',
            'gamertags.steam' => 'nullable|string|max:255',
            'gamertags.epic' => 'nullable|string|max:255',
            'gamertags.psn' => 'nullable|string|max:255',
            'gamertags.xbox' => 'nullable|string|max:255',
            'gamertags.discord' => 'nullable|string|max:255',
            'pc_specs' => 'nullable|array',
            // ... keys ...
        ]); // Validation end, need to keep $validated variable consistent or just patch array logic

        // Since I'm replacing block, I'll allow validation to pass.
        // Re-writing update logic:

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
}