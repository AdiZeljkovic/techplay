<?php

namespace Tests\Feature;

use App\Models\Rank;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Talking on Discord, and the ladder it counts toward.
 *
 * The bot pays 15 XP a message on a 60-second cooldown. That was fine; what
 * was not fine is where it landed. `DiscordXpController` incremented
 * `users.xp` directly — past `XpService`, and therefore past the site's
 * hundred-a-day cap, past the season multiplier, past the reward ledger. Its
 * only guard was 100 per request.
 *
 * The arithmetic: 900 an hour, 21,600 a day if somebody keeps talking, against
 * a comment on the site worth 10 and a finished game worth 15. Chat outpaid
 * every other thing on the platform by two orders of magnitude — on the one
 * ladder the profile now measures standing by.
 */
class DiscordXpEconomyTest extends TestCase
{
    use RefreshDatabase;

    private function botPost(array $body)
    {
        return $this->withHeaders(['X-Discord-Bot-Token' => config('services.discord.bot_secret')])
            ->postJson('/api/v1/discord/xp', $body);
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.discord.bot_secret' => 'test-bot-secret']);
        Rank::create(['name' => 'Newcomer', 'min_xp' => 0, 'color' => '#808080', 'icon' => '/ranks/newcomer.webp']);
    }

    public function test_chat_xp_stops_at_the_same_daily_cap_as_the_website(): void
    {
        $user = User::factory()->create(['discord_id' => '1234567890', 'xp' => 0]);

        // Seven messages reach the ceiling; the eighth pays nothing.
        for ($i = 0; $i < 10; $i++) {
            $this->botPost(['discord_id' => '1234567890', 'xp' => XpService::XP_DISCORD_MESSAGE])->assertOk();
        }

        $this->assertSame(XpService::DAILY_XP_CAP, (int) $user->fresh()->xp);
    }

    public function test_the_reply_says_what_actually_landed(): void
    {
        $user = User::factory()->create(['discord_id' => '1234567890', 'xp' => 0]);

        // Fill the day to five short of the cap.
        for ($i = 0; $i < 6; $i++) {
            $this->botPost(['discord_id' => '1234567890', 'xp' => 15]);
        }

        // The seventh asks for 15 and can only be paid 10. The bot announces
        // this number in a channel, so it has to be the one that landed.
        $response = $this->botPost(['discord_id' => '1234567890', 'xp' => 15])->assertOk();

        $this->assertSame(10, $response->json('xp_awarded'));
        $this->assertSame(XpService::DAILY_XP_CAP, (int) $user->fresh()->xp);
    }

    public function test_a_request_above_one_message_is_refused(): void
    {
        User::factory()->create(['discord_id' => '1234567890']);

        // The ceiling used to be 100 — nearly seven messages in one call. A
        // message is worth a message.
        $this->botPost(['discord_id' => '1234567890', 'xp' => 100])->assertStatus(400);
    }

    public function test_an_unlinked_discord_id_is_not_an_error(): void
    {
        // Most people in the server have no account here. That is ordinary.
        $this->botPost(['discord_id' => '999999999999', 'xp' => 15])->assertStatus(404);
    }

    public function test_the_endpoint_still_refuses_anyone_without_the_bot_secret(): void
    {
        User::factory()->create(['discord_id' => '1234567890']);

        $this->postJson('/api/v1/discord/xp', ['discord_id' => '1234567890', 'xp' => 15])
            ->assertStatus(401);
    }

    public function test_a_rank_up_is_reported_so_the_bot_can_announce_it(): void
    {
        Rank::create(['name' => 'Player', 'min_xp' => 100, 'color' => '#909090', 'icon' => '/ranks/player.webp']);

        $user = User::factory()->create(['discord_id' => '1234567890', 'xp' => 90]);

        $response = $this->botPost(['discord_id' => '1234567890', 'xp' => 15])->assertOk();

        $this->assertTrue($response->json('rank_up'));
        $this->assertSame('Player', $response->json('new_rank'));
        $this->assertSame('Player', $user->fresh('rank')->rank->name);
    }
}
