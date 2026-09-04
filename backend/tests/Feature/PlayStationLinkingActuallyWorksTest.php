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
 * Sony's `me` profile answers with onlineId, avatars, languages and isPlus —
 * and no accountId, because the caller is the account. We read `accountId`
 * from it anyway, got null every time, and told every reader "PlayStation
 * didn't say who you are". Zero PlayStation accounts existed on 4 September
 * 2026 while Steam, Epic, Xbox and GOG all had rows.
 *
 * Three things hid it. The message went out as a 502, and Cloudflare replaces
 * a 502 body with its own error page, so no reader ever saw the sentence.
 * Production runs LOG_LEVEL=error while the service logged warnings, so no
 * line reached disk. And no test ever put Sony's real answer in front of the
 * code — the fixtures all included an accountId that Sony does not send.
 *
 * This is that fixture.
 */
class PlayStationLinkingActuallyWorksTest extends TestCase
{
    use RefreshDatabase;

    /** A PSN access token: three dots-separated segments, `sub` is the account id. */
    private function jwt(string $accountId): string
    {
        $segment = fn (array $claims) => rtrim(strtr(base64_encode(json_encode($claims)), '+/', '-_'), '=');

        return $segment(['alg' => 'RS256', 'typ' => 'JWT'])
            .'.'.$segment(['sub' => $accountId, 'scp' => ['psn:mobile.v2.core'], 'exp' => time() + 3600])
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
            'm.np.playstation.com/api/userProfile/v1/internal/users/me/profiles' => Http::response([
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
        // Taken from the token's `sub`, since the profile does not carry it.
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
            'm.np.playstation.com/api/userProfile/v1/internal/users/me/profiles' => Http::sequence()
                ->push(['onlineId' => 'FirstReader', 'isMe' => true])
                ->push(['onlineId' => 'SecondReader', 'isMe' => true]),
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
            'm.np.playstation.com/api/userProfile/v1/internal/users/me/profiles' => Http::response([]),
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
