<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Linking a Steam account, and the substitution that quietly broke it.
 *
 * PHP rewrites a dot in a query-string key to an underscore, so the assertion
 * Steam sends as `openid.claimed_id` arrives in `$request->all()` as
 * `openid_claimed_id`. check_authentication requires every field echoed back
 * under its original name, so verification answered is_valid:false every time
 * — three attempts across two weeks, all redirecting to an error flag nothing
 * displayed. From the outside it was a button that did nothing.
 */
class SteamOpenIdCallbackTest extends TestCase
{
    use RefreshDatabase;

    /** A realistic assertion, with the dots Steam actually sends. */
    private function callbackUrl(string $state, string $steamId = '76561198000000001'): string
    {
        $params = [
            'state' => $state,
            'openid.ns' => 'http://specs.openid.net/auth/2.0',
            'openid.mode' => 'id_res',
            'openid.op_endpoint' => 'https://steamcommunity.com/openid/login',
            'openid.claimed_id' => 'https://steamcommunity.com/openid/id/'.$steamId,
            'openid.identity' => 'https://steamcommunity.com/openid/id/'.$steamId,
            'openid.return_to' => 'https://api-beta.techplay.gg/api/v1/connected-accounts/steam/callback?state='.$state,
            'openid.response_nonce' => '2026-08-22T20:00:00Zabcdef',
            'openid.assoc_handle' => '1234567890',
            'openid.signed' => 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
            'openid.sig' => 'Zm9vYmFyc2ln',
        ];

        // http_build_query keeps the dots; it is the *reading* side that
        // rewrites them, which is the whole point of this test.
        return '/api/v1/connected-accounts/steam/callback?'.http_build_query($params);
    }

    public function test_a_valid_assertion_links_the_account(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $state = Str::random(48);
        Cache::put('steam:link:'.$state, $user->id, now()->addMinutes(10));

        Http::fake([
            'steamcommunity.com/openid/login' => Http::response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"),
            '*' => Http::response(['response' => ['players' => [['personaname' => 'garamel94']]]]),
        ]);

        $this->get($this->callbackUrl($state))
            ->assertRedirectContains('steam_connected=1');

        $account = ConnectedAccount::where('user_id', $user->id)->where('provider', 'steam')->first();

        $this->assertNotNull($account, 'The callback verified the assertion but stored nothing.');
        $this->assertSame('76561198000000001', $account->provider_user_id);
    }

    /**
     * The regression itself: what we send back to Steam.
     *
     * Against the old controller every key here arrived as `openid_sig`,
     * `openid_signed` and so on, and the only dotted one was the mode this
     * code sets itself.
     */
    public function test_the_assertion_is_echoed_back_with_its_dots_intact(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $state = Str::random(48);
        Cache::put('steam:link:'.$state, $user->id, now()->addMinutes(10));

        Http::fake([
            'steamcommunity.com/openid/login' => Http::response("is_valid:true\n"),
            '*' => Http::response(['response' => ['players' => []]]),
        ]);

        $this->get($this->callbackUrl($state));

        Http::assertSent(function ($request) {
            if (! str_contains($request->url(), 'steamcommunity.com/openid/login')) {
                return false;
            }

            $data = $request->data();

            return ($data['openid.mode'] ?? null) === 'check_authentication'
                && isset($data['openid.sig'], $data['openid.signed'], $data['openid.claimed_id'])
                // Our own handle is not part of the assertion and must not travel.
                && ! isset($data['state'])
                // And nothing may arrive under the rewritten name.
                && ! isset($data['openid_sig']);
        });
    }

    public function test_an_assertion_steam_rejects_links_nothing(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $state = Str::random(48);
        Cache::put('steam:link:'.$state, $user->id, now()->addMinutes(10));

        Http::fake([
            'steamcommunity.com/openid/login' => Http::response("is_valid:false\n"),
            '*' => Http::response([]),
        ]);

        $this->get($this->callbackUrl($state))
            ->assertRedirectContains('steam_error=1');

        $this->assertDatabaseMissing('connected_accounts', ['user_id' => $user->id, 'provider' => 'steam']);
    }

    /** A callback with no signature never reaches Steam at all. */
    public function test_a_callback_without_a_signature_is_refused_locally(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $state = Str::random(48);
        Cache::put('steam:link:'.$state, $user->id, now()->addMinutes(10));

        $this->get('/api/v1/connected-accounts/steam/callback?state='.$state)
            ->assertRedirectContains('steam_error=1');

        Http::assertNothingSent();
    }

    /** The handle is single-use, so a replayed callback links nothing. */
    public function test_a_replayed_callback_finds_no_handle(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $state = Str::random(48);
        Cache::put('steam:link:'.$state, $user->id, now()->addMinutes(10));

        Http::fake([
            'steamcommunity.com/openid/login' => Http::response("is_valid:true\n"),
            '*' => Http::response(['response' => ['players' => []]]),
        ]);

        $url = $this->callbackUrl($state);

        $this->get($url)->assertRedirectContains('steam_connected=1');
        $this->get($url)->assertRedirectContains('steam_error=1');

        $this->assertSame(1, ConnectedAccount::where('user_id', $user->id)->count());
    }
}
