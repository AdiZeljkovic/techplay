<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The profile of anybody linked to Discord must load.
 *
 * `discord_guild_joined_at` and `discord_guild_checked_at` had no cast, so
 * Eloquent handed them back as raw strings while AuthController's profile
 * payload called `->toIso8601String()` on one — a fatal 500 rather than a
 * missing field.
 *
 * It hid for months because nothing wrote those columns: the bot's guild sync
 * is the only writer, and Discord sign-in did not work until 30.08.2026. Every
 * row still held null, `?->` short-circuited, and the first account to carry a
 * value was the first to break. Its owner saw "User Not Found" on his own
 * profile with 1,895 XP sitting behind it.
 */
class DiscordTimestampsAreDatesTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function the_discord_timestamps_are_cast_to_dates(): void
    {
        $user = User::factory()->create([
            'discord_id' => '710629268882718810',
            'discord_guild_member' => true,
            'discord_guild_joined_at' => now()->subDay(),
            'discord_guild_checked_at' => now(),
        ]);

        $fresh = $user->fresh();

        $this->assertInstanceOf(CarbonInterface::class, $fresh->discord_guild_joined_at);
        $this->assertInstanceOf(CarbonInterface::class, $fresh->discord_guild_checked_at);
    }

    /**
     * The exact call that produced the 500, on a fresh read from the database
     * rather than on the in-memory model that still holds what was assigned.
     */
    #[Test]
    public function the_profile_payload_can_format_the_join_date(): void
    {
        $user = User::factory()->create([
            'username' => 'XLBanana47',
            'discord_id' => '710629268882718810',
            'discord_guild_member' => true,
            'discord_guild_joined_at' => now()->subDay(),
        ]);

        $this->assertIsString($user->fresh()->discord_guild_joined_at?->toIso8601String());
    }

    #[Test]
    public function a_linked_members_profile_answers_rather_than_erroring(): void
    {
        $viewer = User::factory()->create(['email_verified_at' => now()]);

        User::factory()->create([
            'username' => 'XLBanana47',
            'email_verified_at' => now(),
            'discord_id' => '710629268882718810',
            'discord_guild_member' => true,
            'discord_guild_joined_at' => now()->subDay(),
            'discord_guild_checked_at' => now(),
        ]);

        // Signed in, because a guest never reached the branch that broke.
        $this->actingAs($viewer)
            ->getJson('/api/v1/users/XLBanana47')
            ->assertOk()
            ->assertJsonPath('user.username', 'XLBanana47');
    }

    /** Nobody linked at all must keep working too. */
    #[Test]
    public function an_unlinked_members_profile_still_answers(): void
    {
        $viewer = User::factory()->create(['email_verified_at' => now()]);
        User::factory()->create(['username' => 'NoDiscord', 'email_verified_at' => now()]);

        $this->actingAs($viewer)
            ->getJson('/api/v1/users/NoDiscord')
            ->assertOk();
    }
}
