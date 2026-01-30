<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class SocialAuthController extends Controller
{
    use \App\Traits\ApiResponse;

    /**
     * Redirect the user to the Discord authentication page.
     */
    public function redirect(Request $request)
    {
        // Stateless for API usage (Sanctum)
        return response()->json([
            'url' => Socialite::driver('discord')->stateless()->redirect()->getTargetUrl(),
        ]);
    }

    /**
     * Obtain the user information from Discord.
     */
    public function callback(Request $request)
    {
        try {
            $discordUser = Socialite::driver('discord')->stateless()->user();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid credentials provided.', 'message' => $e->getMessage()], 422);
        }

        // Logic A: Linking to existing logged-in user
        // Since we are stateless, we can't easily trust $request->user() here unless the client sends the token
        // BUT the client is the browser redirecting back from Discord, so it likely doesn't have the Bearer token in headers.

        // SCENARIO 1: Linking Account (User is already logged in on frontend)
        // Frontend should have sent us a 'state' or we handle linking after getting the discord user?
        // Actually, if we just identify the user by discord_id:

        $existingUser = User::where('discord_id', $discordUser->getId())->first();

        if ($existingUser) {
            // User exists with this Discord ID.
            // Login logic:
            $token = $existingUser->createToken('auth_token')->plainTextToken;

            // Check if email matches and verify it if needed? 
            // Trusting Discord email? Generally yes.
            if (!$existingUser->email_verified_at && $discordUser->getEmail()) {
                $existingUser->update(['email_verified_at' => now()]);
            }

            // Redirect to frontend with token
            return redirect(config('app.frontend_url') . '/auth/callback?token=' . $token);
        }

        // SCENARIO 2: Registering or Linking?
        // If we want to support registration via Discord:

        // Check if email exists
        $userWithEmail = User::where('email', $discordUser->getEmail())->first();

        if ($userWithEmail) {
            // Link Discord to existing email account
            $userWithEmail->update([
                'discord_id' => $discordUser->getId(),
                'discord_token' => $discordUser->token,
                'discord_refresh_token' => $discordUser->refreshToken,
                'discord_avatar' => $discordUser->getAvatar(),
                'gamertags' => array_merge($userWithEmail->gamertags ?? [], ['discord' => $discordUser->getNickname() ?? $discordUser->getName()])
            ]);

            $token = $userWithEmail->createToken('auth_token')->plainTextToken;
            return redirect(config('app.frontend_url') . '/auth/callback?token=' . $token);
        }

        // SCENARIO 3: New User Registration
        // Create new user
        $newUser = User::create([
            'name' => $discordUser->getName(),
            'username' => strtolower(str_replace(' ', '', $discordUser->getNickname() ?? $discordUser->getName())) . rand(1000, 9999), // Temporary username
            'email' => $discordUser->getEmail(),
            'password' => bcrypt(str()->random(16)), // Random password
            'email_verified_at' => now(), // Verified via Discord
            'discord_id' => $discordUser->getId(),
            'discord_token' => $discordUser->token,
            'discord_refresh_token' => $discordUser->refreshToken,
            'discord_avatar' => $discordUser->getAvatar(),
            'gamertags' => ['discord' => $discordUser->getNickname() ?? $discordUser->getName()],
            'role' => 'user'
        ]);

        $token = $newUser->createToken('auth_token')->plainTextToken;
        return redirect(config('app.frontend_url') . '/auth/callback?token=' . $token);
    }
}
