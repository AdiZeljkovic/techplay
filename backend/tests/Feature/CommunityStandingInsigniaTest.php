<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Community Standing card wears the site's own artwork.
 *
 * It drew a hex plate with lucide's cardboard-box glyph inside it — a
 * placeholder on a site that commissioned an insignia set and draws it in the
 * hero, on the locked profile and on the leaderboard. Each Standing tier now
 * names one, and the tier is the only place that decides which.
 *
 * The Standing ladder keeps its own names (Rookie → Legend, never
 * Bronze/Silver/Gold) so it cannot be mistaken for the XP ladder; sharing the
 * artwork does not change that, because the emblems carry no lettering.
 */
class CommunityStandingInsigniaTest extends TestCase
{
    use RefreshDatabase;

    private function tierFor(int $reputation): array
    {
        return app(ProfileService::class)->rankingTier($reputation);
    }

    public function test_every_standing_tier_names_an_insignia(): void
    {
        foreach (config('ranking.tiers') as $tier) {
            $this->assertArrayHasKey('icon', $tier, "{$tier['name']} has no insignia");
            $this->assertNotEmpty($tier['icon']);
        }
    }

    public function test_the_ladder_climbs_and_carries_its_artwork_with_it(): void
    {
        [$lowName, , , $lowIcon] = $this->tierFor(0);
        [$highName, , , $highIcon] = $this->tierFor(50_000);

        $this->assertSame('Rookie', $lowName);
        $this->assertSame('Legend', $highName);
        // Two tiers, two emblems — an icon that never changes is decoration,
        // not a rank.
        $this->assertNotSame($lowIcon, $highIcon);
    }

    public function test_the_standing_set_avoids_the_four_ranks_everybody_wears(): void
    {
        // Nearly every account on the site sits in the first four XP ranks, so
        // those emblems are the ones that would otherwise land on screen twice
        // — once in the hero, once in this card.
        $taken = ['newcomer', 'player', 'rookie', 'bronze'];

        foreach (config('ranking.tiers') as $tier) {
            $stem = pathinfo($tier['icon'], PATHINFO_FILENAME);
            $this->assertNotContains($stem, $taken, "Standing tier {$tier['name']} reuses the common {$stem} insignia");
        }
    }

    public function test_a_tier_without_artwork_falls_back_rather_than_breaking(): void
    {
        // A config cache written before the artwork was assigned hands back
        // tiers with no `icon` key. The card draws a plain medal in the tier
        // colour for a null; it would draw a broken image for a bad path.
        config(['ranking.tiers' => [
            ['name' => 'Rookie', 'min' => 0, 'color' => '#9CA3AF'],
        ]]);

        [, , , $icon] = $this->tierFor(10);

        $this->assertNull($icon);
    }

    public function test_the_public_payload_sends_the_insignia_with_the_tier(): void
    {
        $user = User::factory()->create(['profile_visibility' => 'public']);

        $response = $this->getJson("/api/v1/users/{$user->username}");

        $response->assertOk()
            ->assertJsonPath('reputation.tier', 'Rookie')
            ->assertJsonPath('reputation.tier_icon', '/ranks/silver.webp');
    }
}
