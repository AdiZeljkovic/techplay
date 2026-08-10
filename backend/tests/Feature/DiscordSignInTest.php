<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

/**
 * Signing in with Discord.
 *
 * The driver was never registered, so every call threw and both buttons led to
 * a 500. Registering it makes the callback reachable — which is exactly why the
 * account-linking rules below had to be fixed in the same change: matching an
 * email address is not proof of owning the account behind it.
 */
class DiscordSignInTest extends TestCase
{
    use RefreshDatabase;

    private function pretendDiscordReturns(array $raw): void
    {
        $user = (new SocialiteUser)->setRaw($raw)->map([
            'id' => $raw['id'],
            'nickname' => $raw['username'] ?? null,
            'name' => $raw['global_name'] ?? $raw['username'] ?? null,
            'email' => $raw['email'] ?? null,
            'avatar' => null,
        ]);
        $user->token = 'access-token';
        $user->refreshToken = 'refresh-token';

        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($user);

        Socialite::shouldReceive('driver')->with('discord')->andReturn($driver);
    }

    public function test_the_discord_driver_is_registered(): void
    {
        // The whole flow used to die here: "Driver [discord] not supported".
        $this->assertInstanceOf(
            \App\Services\Socialite\DiscordProvider::class,
            \Laravel\Socialite\Facades\Socialite::driver('discord')
        );
    }

    public function test_an_unverified_discord_address_cannot_claim_an_existing_account(): void
    {
        $victim = User::factory()->create([
            'email' => 'victim@example.com',
            'email_verified_at' => now(),
        ]);

        // Anyone can put someone else's address on a Discord account; only
        // confirming it proves anything.
        $this->pretendDiscordReturns([
            'id' => '999',
            'username' => 'attacker',
            'email' => 'victim@example.com',
            'verified' => false,
        ]);

        $response = $this->get('/api/v1/auth/discord/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('error=', $response->headers->get('Location'));

        $victim->refresh();
        $this->assertNull($victim->discord_id, 'the victim account must not be linked');
        $this->assertSame(0, $victim->tokens()->count(), 'no session may be issued');
    }

    public function test_a_verified_discord_address_will_not_claim_an_unverified_local_account(): void
    {
        // Both sides have to have proved the same mailbox. An unverified local
        // account is one somebody registered — not necessarily its owner.
        $squatted = User::factory()->create([
            'email' => 'taken@example.com',
            'email_verified_at' => null,
        ]);

        $this->pretendDiscordReturns([
            'id' => '1000',
            'username' => 'someone',
            'email' => 'taken@example.com',
            'verified' => true,
        ]);

        $response = $this->get('/api/v1/auth/discord/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('error=', $response->headers->get('Location'));
        $this->assertNull($squatted->fresh()->discord_id);
    }

    public function test_a_verified_address_on_both_sides_links_and_signs_in(): void
    {
        $user = User::factory()->create([
            'email' => 'player@example.com',
            'email_verified_at' => now(),
        ]);

        $this->pretendDiscordReturns([
            'id' => '1234567890',
            'username' => 'player',
            'email' => 'player@example.com',
            'verified' => true,
        ]);

        $response = $this->get('/api/v1/auth/discord/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('/auth/callback?token=', $response->headers->get('Location'));
        $this->assertSame('1234567890', $user->fresh()->discord_id);
    }

    public function test_discord_without_an_email_is_turned_away_rather_than_crashing(): void
    {
        $this->pretendDiscordReturns([
            'id' => '2000',
            'username' => 'noemail',
            'verified' => false,
        ]);

        $response = $this->get('/api/v1/auth/discord/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('error=', $response->headers->get('Location'));
        $this->assertSame(0, User::where('discord_id', '2000')->count());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
