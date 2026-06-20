<?php

namespace App\Services\Socialite;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;

class BattleNetProvider extends AbstractProvider
{
    protected $scopes = ['wow.profile', 'openid'];

    protected $scopeSeparator = ' ';

    /**
     * Get the authentication URL for the provider.
     *
     * @param  string  $state
     * @return string
     */
    protected function getAuthUrl($state)
    {
        $region = request()->get('region', 'us'); // us, eu, kr, tw
        $baseUrl = "https://{$region}.battle.net";

        return $this->buildAuthUrlFromBase($baseUrl.'/oauth/authorize', $state);
    }

    /**
     * Get the token URL for the provider.
     *
     * @return string
     */
    protected function getTokenUrl()
    {
        $region = session('battlenet_region', 'us');

        return "https://{$region}.battle.net/oauth/token";
    }

    /**
     * Get the raw user for the given access token.
     *
     * @param  string  $token
     * @return array
     */
    protected function getUserByToken($token)
    {
        $region = session('battlenet_region', 'us');
        $response = $this->getHttpClient()->get("https://{$region}.battle.net/oauth/userinfo", [
            'headers' => ['Authorization' => 'Bearer '.$token],
        ]);

        return json_decode($response->getBody(), true);
    }

    /**
     * Map the raw user array to a Socialite User instance.
     *
     * @return User
     */
    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['id'],           // Battle.net ID (integer)
            'battletag' => $user['battletag'] ?? null, // e.g., "Garamel#2123"
            'name' => isset($user['battletag']) ? explode('#', $user['battletag'])[0] : null, // "Garamel"
            'email' => null, // Battle.net doesn't provide email via userinfo endpoint
        ]);
    }
}
