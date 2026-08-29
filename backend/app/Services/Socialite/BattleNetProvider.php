<?php

namespace App\Services\Socialite;

use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;

class BattleNetProvider extends AbstractProvider
{
    /**
     * Battle.net is four separate OAuth installations, not one.
     *
     * A code issued by `eu.battle.net` is only redeemable at `eu.battle.net`,
     * and the account it describes only exists on that region's userinfo
     * endpoint. So every one of the three URLs below has to name the same
     * region, or the exchange fails.
     *
     * They used to be read from `session('battlenet_region')`, written by the
     * controller one request earlier. **These are API routes, and the `api`
     * middleware group has no `StartSession`** — verified on production, the
     * redirect returns no `Set-Cookie` at all. So the write went to a session
     * that ended with the request and every read here fell through to the
     * default.
     *
     * The redirect happened to work anyway, because `getAuthUrl` read the
     * region straight off the query string of the request it was handling. The
     * callback is a different request: a European player was sent to
     * `eu.battle.net`, signed in, came back with a European code — and this
     * class tried to redeem it against `us.battle.net`. Sign-in could only ever
     * have worked for `us`.
     *
     * The region now arrives explicitly, carried across the round trip in the
     * OAuth `state` parameter rather than in a session that is not there.
     */
    public const REGIONS = ['us', 'eu', 'kr', 'tw'];

    protected $scopes = ['wow.profile', 'openid'];

    protected $scopeSeparator = ' ';

    protected string $region = 'us';

    /** Anything unrecognised becomes `us` rather than a URL that does not resolve. */
    public function setRegion(?string $region): static
    {
        $this->region = in_array($region, self::REGIONS, true) ? $region : 'us';

        return $this;
    }

    public function getRegion(): string
    {
        return $this->region;
    }

    /**
     * Get the authentication URL for the provider.
     *
     * @param  string  $state
     * @return string
     */
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase("https://{$this->region}.battle.net/oauth/authorize", $state);
    }

    /**
     * Get the token URL for the provider.
     *
     * @return string
     */
    protected function getTokenUrl()
    {
        return "https://{$this->region}.battle.net/oauth/token";
    }

    /**
     * Get the raw user for the given access token.
     *
     * @param  string  $token
     * @return array
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get("https://{$this->region}.battle.net/oauth/userinfo", [
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
