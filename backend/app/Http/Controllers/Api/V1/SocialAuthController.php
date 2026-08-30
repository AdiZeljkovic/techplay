<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserIntegration;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
     * How long a half-finished link stays valid.
     */
    private const LINK_TTL = 600;

    /** One namespace, so a stray cache key cannot be mistaken for an intent. */
    private function linkKey(string $nonce): string
    {
        return 'discord:link-intent:'.$nonce;
    }

    /**
     * POST /auth/discord/link-intent — "this is me, about to connect Discord".
     *
     * Two buttons send people to the redirect below and they mean opposite
     * things: the one on the login page is a stranger signing in, the one in
     * Settings is a member already signed in who wants Discord attached to the
     * account they are sitting in. Until now both arrived with no parameters at
     * all, so the callback had to guess, and it guessed by email address.
     *
     * That is not a detail. On 30.08.2026 a member with 1,895 XP pressed Connect
     * in Settings, his Discord address was not the address on his account — most
     * people's are not — and the callback did the only thing left to it: made a
     * second account with nothing on it and signed him into that. His level
     * looked reset. Nothing was lost, but nothing about the screen said so.
     *
     * So the browser stops carrying the question and starts carrying the answer.
     * This endpoint requires a token, which means the caller has already proved
     * who they are; it hands back a nonce that says so, and the callback links
     * to that member and no one else. Email matching stays only for the case it
     * was meant for — a stranger signing in whose address we already know.
     */
    public function linkIntent(Request $request): JsonResponse
    {
        $nonce = Str::random(40);

        Cache::put($this->linkKey($nonce), $request->user()->id, self::LINK_TTL);

        return $this->success(['state' => $nonce]);
    }

    public function redirect(Request $request)
    {
        // An actual redirect, not JSON. The frontend navigates the browser
        // here with window.location.href, so returning a JSON body meant the
        // user landed on a page of raw JSON instead of Discord.
        //
        // guilds.join is requested so the callback can add them to the server.
        //
        // `state` is passed through untouched when the caller has one. Socialite
        // in stateless mode adds no state of its own, and `with()` is merged
        // over the code fields, so this is the whole mechanism.
        $driver = Socialite::driver('discord')
            ->stateless()
            ->scopes(['identify', 'email', 'guilds.join']);

        $state = (string) $request->query('state', '');

        if ($state !== '') {
            $driver->with(['state' => $state]);
        }

        return $driver->redirect();
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

        /*
         * SCENARIO 0: a member who was signed in and pressed Connect.
         *
         * `state` is a nonce this app issued to an authenticated caller, so it
         * is proof of who asked — the one thing the callback never had before.
         * Pulled rather than read, so it cannot be replayed.
         *
         * This runs first on purpose. Everything below identifies people by
         * address, and a Discord address is usually not the address on the
         * account; guessing from it is what attached a second, empty account to
         * a member with 1,895 XP and made his level look reset.
         */
        $linkedUserId = Cache::pull($this->linkKey((string) $request->query('state', '')));

        if ($linkedUserId && ($linker = User::find($linkedUserId))) {
            $takenBy = User::where('discord_id', $discordUser->getId())
                ->where('id', '!=', $linker->id)
                ->first();

            if ($takenBy) {
                Log::warning('Discord link refused: already on another account', [
                    'discord_id' => $discordUser->getId(),
                    'held_by' => $takenBy->id,
                    'requested_by' => $linker->id,
                ]);

                return redirect(config('app.frontend_url').'/settings?error='.urlencode(
                    'That Discord account is already connected to another TechPlay account.'
                ));
            }

            $linker->update([
                'discord_id' => $discordUser->getId(),
                'discord_avatar' => $discordUser->getAvatar(),
                'gamertags' => array_merge($linker->gamertags ?? [], [
                    'discord' => $discordUser->getNickname() ?? $discordUser->getName(),
                ]),
            ]);

            $this->storeTokens($linker, 'discord', $discordUser->token, $discordUser->refreshToken);
            $this->addUserToGuild($discordUser->getId(), $discordUser->token);

            Log::info('Discord linked to the account that asked', ['user_id' => $linker->id]);

            // No new token: they were already signed in, and handing back a
            // fresh one would replace the session they started this from.
            return redirect(config('app.frontend_url').'/settings?discord=linked');
        }

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
            // `role` omitted: the legacy column has no reader left and its
            // default is already 'user'. See the note in AuthController@register.
        ]);

        $this->storeTokens($newUser, 'discord', $discordUser->token, $discordUser->refreshToken);

        // Auto-join new user to our Discord server
        $this->addUserToGuild($discordUser->getId(), $discordUser->token);

        $token = $newUser->createToken('auth_token')->plainTextToken;

        return redirect(config('app.frontend_url').'/auth/callback?token='.$token);
    }
}
