<?php

namespace App\Services\Socialite;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;

/**
 * Discord OAuth2.
 *
 * Socialite has no Discord driver and no provider package was ever installed,
 * so `Socialite::driver('discord')` threw "Driver [discord] not supported" on
 * every call — both login buttons led to a 500. Written here rather than pulled
 * in as a dependency, the same way Battle.net already is.
 *
 * `verified` is carried through deliberately: Discord hands out addresses the
 * owner has not confirmed, and the callback links accounts by email. Without it
 * there is no way to tell a proven address from a claimed one.
 */
class DiscordProvider extends AbstractProvider
{
    /**
     * `guilds.join` is what makes the auto-join on sign-up actually work.
     *
     * `SocialAuthController::addUserToGuild()` has been called on every Discord
     * sign-up since it was written, and it could not have succeeded: Discord's
     * `PUT /guilds/{id}/members/{user}` needs the *user's* access token to carry
     * this scope, and it was never asked for. It also needs a bot token the
     * backend did not hold — that one was on the machine all along, in the bot's
     * own env, and is now in the backend's too.
     *
     * The cost is visible: the consent screen now says the app may join servers
     * for you, alongside the username and email it already asked for. That is a
     * fair description of what happens next, and the alternative was a button
     * that quietly did three-quarters of what it claimed.
     *
     * Worth knowing: the call sits on all three branches of the callback — new
     * account, account linked by email, and returning member — so it runs on
     * every Discord sign-in, not only the first. Someone who leaves the server
     * and signs in again is put back. Discord answers 204 for a member who is
     * already there, so the repeat costs one request and changes nothing.
     */
    protected $scopes = ['identify', 'email', 'guilds.join'];

    protected $scopeSeparator = ' ';

    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase('https://discord.com/oauth2/authorize', $state);
    }

    protected function getTokenUrl()
    {
        return 'https://discord.com/api/oauth2/token';
    }

    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get('https://discord.com/api/users/@me', [
            'headers' => [
                'Authorization' => 'Bearer '.$token,
                'Accept' => 'application/json',
            ],
        ]);

        return json_decode((string) $response->getBody(), true);
    }

    protected function mapUserToObject(array $user)
    {
        // Discord retired discriminators: `global_name` is the display name for
        // migrated accounts, `username` is the handle.
        $nickname = $user['global_name'] ?? $user['username'] ?? null;

        return (new User)->setRaw($user)->map([
            'id' => $user['id'],
            'nickname' => $user['username'] ?? $nickname,
            'name' => $nickname,
            'email' => $user['email'] ?? null,
            'avatar' => $this->avatarUrl($user),
        ]);
    }

    private function avatarUrl(array $user): ?string
    {
        if (empty($user['avatar'])) {
            return null;
        }

        $extension = str_starts_with($user['avatar'], 'a_') ? 'gif' : 'png';

        return "https://cdn.discordapp.com/avatars/{$user['id']}/{$user['avatar']}.{$extension}";
    }
}
