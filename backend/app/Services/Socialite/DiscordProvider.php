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
    protected $scopes = ['identify', 'email'];

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
