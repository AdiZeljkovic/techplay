<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserIntegration;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * OAuth secrets live in user_integrations, encrypted at rest — never
     * on the users row. Failure to store must never break the login.
     */
    private function storeTokens($user, string $provider, ?string $access, ?string $refresh): void
    {
        try {
            UserIntegration::updateOrCreate(
                ['user_id' => $user->id, 'provider' => $provider],
                ['access_token' => $access, 'refresh_token' => $refresh]
            );
        } catch (\Throwable $e) {
            Log::warning('storeTokens failed: '.$e->getMessage());
        }
    }

    use ApiResponse;

    /**
     * Redirect the user to the Discord authentication page.
     */
    public function redirect(Request $request)
    {
        // An actual redirect, not JSON. The frontend navigates the browser
        // here with window.location.href, so returning a JSON body meant the
        // user landed on a page of raw JSON instead of Discord.
        //
        // guilds.join is requested so the callback can add them to the server.
        return Socialite::driver('discord')
            ->stateless()
            ->scopes(['identify', 'email', 'guilds.join'])
            ->redirect();
    }

    /**
     * Did the provider say the owner actually confirmed this address?
     *
     * Discord returns `verified: false` for addresses nobody proved they
     * control, and this app links accounts by address — so without the flag,
     * "has an email" and "owns an email" look identical.
     */
    private function providerEmailIsVerified($socialUser): bool
    {
        $raw = $socialUser->user ?? [];

        return ($raw['verified'] ?? false) === true;
    }

    /**
     * A free username derived from the Discord handle.
     *
     * The old version appended rand(1000,9999) once and hoped: a collision
     * threw a unique-constraint 500 in the middle of signup, with the account
     * half-created.
     */
    private function uniqueUsername(?string $preferred): string
    {
        $base = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', (string) $preferred));
        $base = substr($base, 0, 20) ?: 'player';

        if (! User::where('username', $base)->exists()) {
            return $base;
        }

        for ($attempt = 0; $attempt < 50; $attempt++) {
            $candidate = $base.random_int(1000, 999999);

            if (! User::where('username', $candidate)->exists()) {
                return $candidate;
            }
        }

        return $base.Str::lower(Str::random(8));
    }

    /**
     * Add user to our Discord server using their access token.
     */
    private function addUserToGuild(string $userId, string $accessToken): bool
    {
        $guildId = config('services.discord.guild_id');
        $botToken = config('services.discord.bot_token');

        if (! $guildId || ! $botToken) {
            Log::warning('Discord guild auto-join disabled: missing guild_id or bot_token');

            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bot '.$botToken,
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

            Log::warning('Failed to add user to guild', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Error adding user to guild: '.$e->getMessage());

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
            Log::error('Discord OAuth failed: '.$e->getMessage());

            // Redirect to frontend with error instead of JSON (browser redirect)
            return redirect(config('app.frontend_url').'/login?error='.urlencode('Discord authentication failed. Please try again.'));
        }

        // Logic A: Linking to existing logged-in user
        // Since we are stateless, we can't easily trust $request->user() here unless the client sends the token
        // BUT the client is the browser redirecting back from Discord, so it likely doesn't have the Bearer token in headers.

        // SCENARIO 1: Linking Account (User is already logged in on frontend)
        // Frontend should have sent us a 'state' or we handle linking after getting the discord user?
        // Actually, if we just identify the user by discord_id:

        $existingUser = User::where('discord_id', $discordUser->getId())->first();

        if ($existingUser) {
            $this->storeTokens($existingUser, 'discord', $discordUser->token, $discordUser->refreshToken);
            // User exists with this Discord ID.
            // Login logic:
            $token = $existingUser->createToken('auth_token')->plainTextToken;

            // Only a confirmed address verifies ours. Discord hands out
            // addresses the owner never proved they control.
            if (! $existingUser->email_verified_at && $this->providerEmailIsVerified($discordUser)) {
                $existingUser->update(['email_verified_at' => now()]);
            }

            // Try to add user to our Discord server (they might have left)
            $this->addUserToGuild($discordUser->getId(), $discordUser->token);

            // Redirect to frontend with token
            return redirect(config('app.frontend_url').'/auth/callback?token='.$token);
        }

        // Everything below creates or claims an account from an address, so
        // an unproven address is where it stops.
        if (! $discordUser->getEmail()) {
            return redirect(config('app.frontend_url').'/login?error='.urlencode(
                'Discord did not share an email address. Add one to your Discord account, or sign in with your password.'
            ));
        }

        if (! $this->providerEmailIsVerified($discordUser)) {
            return redirect(config('app.frontend_url').'/login?error='.urlencode(
                'Verify your email with Discord first, then try again.'
            ));
        }

        // SCENARIO 2: an account already exists on that address.
        $userWithEmail = User::where('email', $discordUser->getEmail())->first();

        if ($userWithEmail) {
            // Matching an address is not proof of owning the account. This used
            // to link and hand back a full token on the match alone, so anyone
            // who put a victim's address on a Discord account could walk into
            // the victim's TechPlay account. Both sides must have proved the
            // same mailbox before the two identities are joined.
            if (! $userWithEmail->hasVerifiedEmail()) {
                Log::warning('Discord link refused: local account unverified', [
                    'user_id' => $userWithEmail->id,
                ]);

                return redirect(config('app.frontend_url').'/login?error='.urlencode(
                    'An account already uses that address. Sign in with your password and link Discord from Settings.'
                ));
            }

            // Link Discord to existing email account
            $userWithEmail->update([
                'discord_id' => $discordUser->getId(),
                'discord_avatar' => $discordUser->getAvatar(),
                'gamertags' => array_merge($userWithEmail->gamertags ?? [], ['discord' => $discordUser->getNickname() ?? $discordUser->getName()]),
            ]);

            $this->storeTokens($userWithEmail, 'discord', $discordUser->token, $discordUser->refreshToken);

            // Auto-join user to our Discord server
            $this->addUserToGuild($discordUser->getId(), $discordUser->token);

            $token = $userWithEmail->createToken('auth_token')->plainTextToken;

            return redirect(config('app.frontend_url').'/auth/callback?token='.$token);
        }

        // SCENARIO 3: New User Registration
        // Create new user
        $newUser = User::create([
            'name' => $discordUser->getName(),
            'username' => $this->uniqueUsername($discordUser->getNickname() ?? $discordUser->getName()),
            'email' => $discordUser->getEmail(),
            'password' => bcrypt(str()->random(16)), // Random password
            'email_verified_at' => now(), // Verified via Discord
            'discord_id' => $discordUser->getId(),
            'discord_avatar' => $discordUser->getAvatar(),
            'gamertags' => ['discord' => $discordUser->getNickname() ?? $discordUser->getName()],
            'role' => 'user',
        ]);

        $this->storeTokens($newUser, 'discord', $discordUser->token, $discordUser->refreshToken);

        // Auto-join new user to our Discord server
        $this->addUserToGuild($discordUser->getId(), $discordUser->token);

        $token = $newUser->createToken('auth_token')->plainTextToken;

        return redirect(config('app.frontend_url').'/auth/callback?token='.$token);
    }
}
