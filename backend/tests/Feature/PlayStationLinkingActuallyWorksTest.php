<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Linking PlayStation had never once worked, and nothing said so.
 *
 * Two wrong assumptions, one on top of the other. The profile was asked for
 * at `/users/me/profiles`, which Sony answers with 400 — `me` works on some
 * PSN endpoints and not that one. And the account id it needs in the path was
 * looked for under `accountId` in the response, then under `sub` in the token;
 * Sony sends neither. The claim is `account_id`. Zero PlayStation accounts
 * existed on 4 September 2026 while Steam, Epic, Xbox and GOG all had rows.
 *
 * Three things hid it. The message went out as a 502, and Cloudflare replaces
 * a 502 body with its own error page, so no reader ever saw the sentence.
 * Production runs LOG_LEVEL=error while the service logged warnings, so no
 * line reached disk. And no test ever put Sony's real answers in front of the
 * code — the fixtures answered whatever the code happened to ask for.
 *
 * This is that fixture. The claim set and the 400 are copied from a live
 * attempt on 4 September, not invented.
 */
class PlayStationLinkingActuallyWorksTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A PSN access token, carrying the claims Sony actually sends.
     *
     * `account_id` is the one that matters. There is deliberately no `sub`
     * here, and `account_uuid` is deliberately a different value: both were
     * guessed at in turn, and a fixture that quietly offers the guess is how a
     * test passes while production fails.
     */
    private function jwt(string $accountId): string
    {
        $segment = fn (array $claims) => rtrim(strtr(base64_encode(json_encode($claims)), '+/', '-_'), '=');

        return $segment(['alg' => 'RS256', 'typ' => 'JWT'])
            .'.'.$segment([
                'account_id' => $accountId,
                'account_uuid' => 'f0e1d2c3-4b5a-6978-8796-a5b4c3d2e1f0',
                'client_id' => '09515159-7237-4370-9b40-3806e67c0891',
                'grant_type' => 'authorization_code',
                'is_child' => false,
                'legal_country' => 'GB',
                'locale' => 'en-GB',
                'exp' => time() + 3600,
            ])
            .'.signature';
    }

    /**
     * Sony's answers, as Sony actually sends them.
     *
     * Note what the profile does not contain.
     */
    private function fakeSony(string $accountId = '1234567890123456789'): void
    {
        Http::fake([
            'ca.account.sony.com/api/authz/v3/oauth/authorize*' => Http::response('', 302, [
                'Location' => 'com.scee.psxandroid.scecompcall://redirect/?code=v3.THECODE',
            ]),
            'ca.account.sony.com/api/authz/v3/oauth/token' => Http::response([
                'access_token' => $this->jwt($accountId),
                'refresh_token' => 'refresh-me',
                'expires_in' => 3600,
            ]),
            // Sony refuses `me` on this endpoint. Anything asking for it gets
            // the 400 a live attempt got, so a regression cannot pass quietly.
            'm.np.playstation.com/api/userProfile/v1/internal/users/me/profiles' => Http::response('', 400),
            "m.np.playstation.com/api/userProfile/v1/internal/users/{$accountId}/profiles" => Http::response([
                'onlineId' => 'GaramelSpawn',
                'aboutMe' => '',
                'avatars' => [['size' => 'l', 'url' => 'https://example.test/a.png']],
                'languages' => ['en-GB'],
                'isPlus' => true,
                'isOfficiallyVerified' => false,
                'isMe' => true,
            ]),
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.psn.enabled', true);
    }

    public function test_a_reader_can_link_playstation(): void
    {
        $this->fakeSony();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(
            '/api/v1/connected-accounts/playstation/connect',
            ['npsso' => str_repeat('a', 64)]
        );

        $response->assertOk();
        $response->assertJsonPath('data.online_id', 'GaramelSpawn');

        $account = ConnectedAccount::where('user_id', $user->id)->where('provider', 'playstation')->first();

        $this->assertNotNull($account, 'Linking answered OK but stored nothing.');
        $this->assertSame('GaramelSpawn', $account->display_name);
        // Taken from the token's `account_id`, which is also what put the
        // profile call on a path Sony answers.
        $this->assertSame('1234567890123456789', $account->provider_user_id);
    }

    /**
     * The id has to be the reader's own, not a constant.
     *
     * `me` would have satisfied every trophy call Sony offers and looked like
     * it worked — right up to the second reader, who would have collided with
     * the first on (provider, provider_user_id).
     */
    public function test_two_readers_get_their_own_account_ids(): void
    {
        // One fake, two tokens — `Http::fake` merges rather than replaces, so
        // a second call would leave the first stub answering both readers and
        // the test would pass for the wrong reason.
        Http::fake([
            'ca.account.sony.com/api/authz/v3/oauth/authorize*' => Http::response('', 302, [
                'Location' => 'com.scee.psxandroid.scecompcall://redirect/?code=v3.THECODE',
            ]),
            'ca.account.sony.com/api/authz/v3/oauth/token' => Http::sequence()
                ->push(['access_token' => $this->jwt('1111111111111111111'), 'refresh_token' => 'a', 'expires_in' => 3600])
                ->push(['access_token' => $this->jwt('2222222222222222222'), 'refresh_token' => 'b', 'expires_in' => 3600]),
            'm.np.playstation.com/api/userProfile/v1/internal/users/1111111111111111111/profiles' => Http::response(['onlineId' => 'FirstReader', 'isMe' => true]),
            'm.np.playstation.com/api/userProfile/v1/internal/users/2222222222222222222/profiles' => Http::response(['onlineId' => 'SecondReader', 'isMe' => true]),
        ]);

        $first = User::factory()->create();
        $this->actingAs($first)
            ->postJson('/api/v1/connected-accounts/playstation/connect', ['npsso' => str_repeat('a', 64)])
            ->assertOk();

        $second = User::factory()->create();
        $this->actingAs($second)
            ->postJson('/api/v1/connected-accounts/playstation/connect', ['npsso' => str_repeat('b', 64)])
            ->assertOk();

        $this->assertSame(
            ['1111111111111111111', '2222222222222222222'],
            ConnectedAccount::where('provider', 'playstation')->orderBy('id')->pluck('provider_user_id')->all()
        );
    }

    /**
     * When it does fail, the reader must be able to read why.
     *
     * Cloudflare replaces a 502 or 504 body from the origin with its own error
     * page. Any status but those two arrives intact.
     */
    public function test_a_failure_uses_a_status_cloudflare_passes_through(): void
    {
        $this->fakeSony();

        // Sony answers the profile call, but with nothing in it.
        Http::fake([
            'm.np.playstation.com/api/userProfile/v1/internal/users/*/profiles' => Http::response([]),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(
            '/api/v1/connected-accounts/playstation/connect',
            ['npsso' => str_repeat('a', 64)]
        );

        $this->assertNotContains(
            $response->status(),
            [502, 504],
            'Cloudflare replaces the body of a 502 or a 504, so the message would never be read.'
        );
        $this->assertNotEmpty($response->json('message'));
    }
}
