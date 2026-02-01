<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SocialAuthController extends Controller
{
    use \App\Traits\ApiResponse;

    /**
     * Redirect the user to the Discord authentication page.
     */
    public function redirect(Request $request)
    {
        // Stateless for API usage (Sanctum)
        // Request guilds.join scope to auto-add users to our server
        return response()->json([
            'url' => Socialite::driver('discord')
                ->stateless()
                ->scopes(['identify', 'email', 'guilds.join'])
                ->redirect()
                ->getTargetUrl(),
        ]);
    }

    /**
     * Add user to our Discord server using their access token.
     */
    private function addUserToGuild(string $userId, string $accessToken): bool
    {
        $guildId = config('services.discord.guild_id');
        $botToken = config('services.discord.bot_token');

        if (!$guildId || !$botToken) {
            Log::warning('Discord guild auto-join disabled: missing guild_id or bot_token');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bot ' . $botToken,
                'Content-Type' => 'application/json',
            ])->put("https://discord.com/api/v10/guilds/{$guildId}/members/{$userId}", [
                'access_token' => $accessToken,
            ]);

            if ($response->successful() || $response->status() === 204) {
                Log::info("User {$userId} added to Discord guild");
                return true;
            }

            // 201 = user added, 204 = user already in guild
            if ($response->status() === 201 || $response->status() === 204) {
                return true;
            }

            Log::warning("Failed to add user to guild", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error("Error adding user to guild: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtain the user information from Discord.
     */
    public function callback(Request $request)
    {
        try {
            $discordUser = Socialite::driver('discord')->stateless()->user();
        } catch (\Exception $e) {
            Log::error('Discord OAuth failed: ' . $e->getMessage());
            // Redirect to frontend with error instead of JSON (browser redirect)
            return redirect(config('app.frontend_url') . '/login?error=' . urlencode('Discord authentication failed. Please try again.'));
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

            // Try to add user to our Discord server (they might have left)
            $this->addUserToGuild($discordUser->getId(), $discordUser->token);

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

            // Auto-join user to our Discord server
            $this->addUserToGuild($discordUser->getId(), $discordUser->token);

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

        // Auto-join new user to our Discord server
        $this->addUserToGuild($discordUser->getId(), $discordUser->token);

        $token = $newUser->createToken('auth_token')->plainTextToken;
        return redirect(config('app.frontend_url') . '/auth/callback?token=' . $token);
    }
}
