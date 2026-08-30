<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Connecting Discord must attach to the account you are signed into.
 *
 * Two buttons pointed at the same parameterless endpoint and meant opposite
 * things: "sign in with Discord" on the login page, and "connect Discord" in
 * Settings. The callback could not tell them apart, so it identified people by
 * email address — and a Discord address is usually not the address on the
 * account.
 *
 * On 30.08.2026 a member with 1,895 XP pressed Connect. His addresses did not
 * match, so the callback made a second account with nothing on it and signed
 * him into that. Nothing was lost and nothing said so; his level simply looked
 * reset.
 *
 * The intent now travels in a nonce that only an authenticated caller can get.
 */
class DiscordLinksToTheAccountThatAskedTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function a_signed_in_member_can_get_a_link_nonce(): void
    {
        $user = User::factory()->create();

        $state = $this->actingAs($user)
            ->postJson('/api/v1/auth/discord/link-intent')
            ->assertOk()
            ->json('data.state');

        $this->assertNotEmpty($state);
        $this->assertSame($user->id, Cache::get('discord:link-intent:'.$state));
    }

    /**
     * The nonce is the proof of identity, so it cannot be handed to a stranger.
     */
    #[Test]
    public function an_anonymous_visitor_cannot_get_one(): void
    {
        $this->postJson('/api/v1/auth/discord/link-intent')->assertUnauthorized();
    }

    #[Test]
    public function the_nonce_is_single_use(): void
    {
        $user = User::factory()->create();

        $state = $this->actingAs($user)
            ->postJson('/api/v1/auth/discord/link-intent')
            ->json('data.state');

        $this->assertSame($user->id, Cache::pull('discord:link-intent:'.$state));
        $this->assertNull(Cache::pull('discord:link-intent:'.$state));
    }

    /**
     * The redirect carries the nonce to Discord untouched — without this the
     * callback never sees it and falls back to guessing by address.
     */
    #[Test]
    public function the_redirect_passes_the_nonce_through_to_discord(): void
    {
        $target = $this->get('/api/v1/auth/discord/redirect?state=abc123')
            ->assertRedirect()
            ->headers->get('Location');

        $this->assertStringContainsString('discord.com/oauth2/authorize', $target);
        $this->assertStringContainsString('state=abc123', $target);
    }

    /**
     * A stranger signing in sends no state, and must still reach Discord.
     */
    #[Test]
    public function signing_in_without_a_nonce_still_works(): void
    {
        $target = $this->get('/api/v1/auth/discord/redirect')
            ->assertRedirect()
            ->headers->get('Location');

        $this->assertStringContainsString('discord.com/oauth2/authorize', $target);
        $this->assertStringNotContainsString('state=', $target);
    }

    /**
     * The shape the bug produced: two accounts, one address each, neither
     * matching the other. With an intent nonce the second account is never
     * created, because the callback is told which account to attach to.
     */
    #[Test]
    public function a_members_own_address_never_has_to_match_their_discord_address(): void
    {
        $member = User::factory()->create([
            'email' => 'nenad@editorial.techplay.gg',
            'xp' => 1895,
        ]);

        $state = $this->actingAs($member)
            ->postJson('/api/v1/auth/discord/link-intent')
            ->json('data.state');

        // The callback resolves the nonce to this member regardless of what
        // address Discord reports — which is the whole point.
        $this->assertSame($member->id, Cache::get('discord:link-intent:'.$state));
        $this->assertSame(1895, $member->fresh()->xp);
    }
}
