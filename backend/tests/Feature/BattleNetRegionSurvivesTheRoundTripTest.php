<?php

namespace Tests\Feature;

use App\Services\Socialite\BattleNetProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Battle.net sign-in could only ever have worked for one region.
 *
 * The region was written to the session on the redirect and read back on the
 * callback — but these are API routes, and the `api` middleware group has no
 * StartSession. Verified on production: the redirect returns no `Set-Cookie` at
 * all. So every read fell through to the 'us' default.
 *
 * The redirect looked fine, because the provider read the region off the query
 * string of the request it was already handling. The callback is a different
 * request. A European player was sent to eu.battle.net, signed in, came back
 * with a European code — and the app tried to redeem it at us.battle.net, which
 * does not know that code.
 *
 * The region now rides in the OAuth `state` parameter, which the provider hands
 * back untouched. That also restores the CSRF protection `stateless()` gives up.
 */
class BattleNetRegionSurvivesTheRoundTripTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function the_redirect_sends_a_european_player_to_the_european_authorize_url(): void
    {
        $target = $this->get('/api/v1/auth/battlenet/redirect?region=eu')
            ->assertRedirect()
            ->headers->get('Location');

        $this->assertStringStartsWith('https://eu.battle.net/oauth/authorize', $target);
    }

    /**
     * The whole point: what the callback reads back has to be what the redirect
     * chose, across two requests with nothing shared between them but `state`.
     */
    #[Test]
    public function the_region_survives_into_a_separate_callback_request(): void
    {
        $state = $this->stateFrom($this->redirectTargetFor('eu'));

        $this->assertSame('eu', Cache::get('battlenet:handshake:'.$state));
    }

    #[Test]
    public function every_supported_region_makes_the_round_trip(): void
    {
        foreach (BattleNetProvider::REGIONS as $region) {
            $state = $this->stateFrom($this->redirectTargetFor($region));

            $this->assertSame($region, Cache::get('battlenet:handshake:'.$state), "region: {$region}");
        }
    }

    #[Test]
    public function an_unknown_region_becomes_us_rather_than_a_url_that_does_not_resolve(): void
    {
        $target = $this->redirectTargetFor('moon');

        $this->assertStringStartsWith('https://us.battle.net/oauth/authorize', $target);
        $this->assertSame('us', Cache::get('battlenet:handshake:'.$this->stateFrom($target)));
    }

    /**
     * A code obtained elsewhere is not a sign-in here.
     *
     * With `stateless()` and no nonce, an attacker could get a code for their
     * own Battle.net account and hand a victim the callback URL — the victim
     * would be signed in as the attacker without noticing.
     */
    #[Test]
    public function a_callback_this_app_did_not_start_is_refused(): void
    {
        $this->get('/api/v1/auth/battlenet/callback?code=stolen&state='.str_repeat('a', 40))
            ->assertRedirectContains('error=oauth_expired');
    }

    #[Test]
    public function a_callback_with_no_state_at_all_is_refused(): void
    {
        $this->get('/api/v1/auth/battlenet/callback?code=stolen')
            ->assertRedirectContains('error=oauth_expired');
    }

    #[Test]
    public function a_state_cannot_be_spent_twice(): void
    {
        $state = $this->stateFrom($this->redirectTargetFor('eu'));

        // The first callback consumes it. It fails at the token exchange —
        // there is no Battle.net here — but the handshake is spent either way.
        $this->get("/api/v1/auth/battlenet/callback?code=whatever&state={$state}");

        $this->get("/api/v1/auth/battlenet/callback?code=whatever&state={$state}")
            ->assertRedirectContains('error=oauth_expired');
    }

    private function redirectTargetFor(string $region): string
    {
        return $this->get("/api/v1/auth/battlenet/redirect?region={$region}")
            ->assertRedirect()
            ->headers->get('Location');
    }

    private function stateFrom(string $url): string
    {
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $this->assertArrayHasKey('state', $query, 'The authorize URL carries no state to bring the region back.');

        return $query['state'];
    }
}
