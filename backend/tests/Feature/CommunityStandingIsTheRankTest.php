<?php

namespace Tests\Feature;

use App\Models\Rank;
use App\Models\ReputationSnapshot;
use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One ladder.
 *
 * The Community Standing card used to run a second progression on forum
 * reputation: six tiers, three divisions each. Two measurements killed it.
 *
 * It could not be climbed. The first promotion sat at 2,000 reputation, and
 * reputation moves ±1 per forum vote and +10 per accepted solution — the site
 * record is 68 across 53 accounts, two of which have any. Every profile read
 * "Rookie III · Top 100% of the community".
 *
 * And it collided. Four of its six names — Rookie, Veteran, Elite, Legend —
 * are also XP rank names, so one profile showed "Noob" in the hero and
 * "Rookie III" in the sidebar and was reported as a bug.
 *
 * The card draws the XP rank now: the ladder that actually moves.
 */
class CommunityStandingIsTheRankTest extends TestCase
{
    use RefreshDatabase;

    private function standing(User $user): array
    {
        return app(ProfileService::class)->reputation($user->fresh());
    }

    private function rank(string $name, int $minXp): Rank
    {
        return Rank::create([
            'name' => $name,
            'min_xp' => $minXp,
            'color' => '#808080',
            'icon' => '/ranks/'.strtolower($name).'.webp',
        ]);
    }

    public function test_the_card_reports_the_xp_rank_and_its_artwork(): void
    {
        $rank = $this->rank('Bronze', 600);
        $user = User::factory()->create(['xp' => 800, 'rank_id' => $rank->id]);

        $standing = $this->standing($user);

        $this->assertSame('Bronze', $standing['rank']['name']);
        $this->assertSame('/ranks/bronze.webp', $standing['rank']['icon']);
        $this->assertSame(800, $standing['xp']);
    }

    public function test_it_names_the_next_band_and_what_it_costs(): void
    {
        $bronze = $this->rank('Bronze', 600);
        $this->rank('Silver', 1000);
        $user = User::factory()->create(['xp' => 800, 'rank_id' => $bronze->id]);

        $next = $this->standing($user)['next_rank'];

        $this->assertSame('Silver', $next['name']);
        $this->assertSame(1000, $next['min_xp']);
    }

    public function test_the_top_of_the_ladder_has_nothing_left_to_fill_toward(): void
    {
        $top = $this->rank('Eternal', 500000);
        $user = User::factory()->create(['xp' => 600000, 'rank_id' => $top->id]);

        // Null, not the same rank again: the card hides its progress bar here
        // rather than drawing one stuck at 100%.
        $this->assertNull($this->standing($user)['next_rank']);
    }

    public function test_the_percentile_is_measured_by_xp_not_by_reputation(): void
    {
        $rank = $this->rank('Noob', 0);

        // One loud forum poster with an empty shelf, and one player who has
        // never posted. On the old ladder the poster was on top.
        $poster = User::factory()->create(['xp' => 10, 'forum_reputation' => 500, 'rank_id' => $rank->id]);
        $player = User::factory()->create(['xp' => 5000, 'forum_reputation' => 0, 'rank_id' => $rank->id]);

        // Relative, not absolute: "Top X%" of a two-person site puts the
        // leader at 50, which is arithmetic rather than a bug. What matters is
        // which of the two the figure favours.
        $this->assertLessThan(
            $this->standing($poster)['percentile'],
            $this->standing($player)['percentile'],
        );
    }

    public function test_the_trend_line_plots_the_same_quantity_as_the_figure_above_it(): void
    {
        $rank = $this->rank('Noob', 0);
        $user = User::factory()->create(['xp' => 900, 'forum_reputation' => 4, 'rank_id' => $rank->id]);

        foreach ([['2026-06', 300, 1], ['2026-07', 600, 2]] as [$period, $xp, $rep]) {
            ReputationSnapshot::create([
                'user_id' => $user->id,
                'period' => $period,
                'xp' => $xp,
                'reputation' => $rep,
                'contribution_points' => 0,
            ]);
        }

        // XP, not reputation — a line drawn from a different quantity than the
        // number it sits under is a chart of something else.
        $this->assertSame([300, 600, 900], $this->standing($user)['history']);
    }

    public function test_reputation_survives_as_a_number(): void
    {
        $rank = $this->rank('Noob', 0);
        $user = User::factory()->create(['xp' => 0, 'forum_reputation' => 68, 'rank_id' => $rank->id]);

        $standing = $this->standing($user);

        $this->assertSame(68, $standing['reputation']);
        // And the tier ladder it used to drive is gone from the payload.
        $this->assertArrayNotHasKey('tier', $standing);
        $this->assertArrayNotHasKey('division', $standing);
    }

    public function test_the_public_payload_carries_standing_and_not_the_old_key(): void
    {
        $rank = $this->rank('Noob', 0);
        $user = User::factory()->create(['profile_visibility' => 'public', 'xp' => 98, 'rank_id' => $rank->id]);

        $response = $this->getJson("/api/v1/users/{$user->username}");

        $response->assertOk()
            ->assertJsonPath('standing.rank.name', 'Noob')
            ->assertJsonPath('standing.xp', 98)
            ->assertJsonMissingPath('reputation');
    }
}
