<?php

namespace Tests\Feature;

use App\Models\Rank;
use App\Models\User;
use App\Services\LevelService;
use Database\Seeders\RankSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One rung per threshold, one place the artwork lives.
 *
 * The ladder was seeded twice under two sets of names — an older Noob /
 * Newbie / Legendary / Global Elite / God of Gaming, and the modern Newcomer
 * / Player / Legend / Radiant / Eternal that `RankSeeder` and
 * `LevelService::ANCHORS` both describe. Twenty-five rows for twenty rungs,
 * five thresholds holding two rungs each, so "next rank" came down to row
 * order: a reader at 98 XP was told they were 2 XP from Player when the row
 * beside it said Newbie at the same 100.
 */
class RankLadderIsSingleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RankSeeder::class);
    }

    public function test_no_two_ranks_share_a_threshold(): void
    {
        $thresholds = Rank::pluck('min_xp');

        $this->assertSame(
            $thresholds->count(),
            $thresholds->unique()->count(),
            'Two rungs at one threshold — "next rank" becomes a matter of row order',
        );
    }

    public function test_the_ladder_matches_the_level_curve_it_is_drawn_from(): void
    {
        // LevelService anchors a level to every rank threshold. A rung the
        // curve has never heard of is a rung nobody can be promoted onto.
        $anchors = (new \ReflectionClass(LevelService::class))->getConstant('ANCHORS');
        $curve = collect($anchors)->map(fn ($a) => $a[0])->sort()->values()->all();
        $ladder = Rank::orderBy('min_xp')->pluck('min_xp')->all();

        $this->assertSame($curve, $ladder);
    }

    public function test_the_retired_names_are_gone(): void
    {
        foreach (['Noob', 'Newbie', 'Legendary', 'Global Elite', 'God of Gaming'] as $retired) {
            $this->assertNull(Rank::where('name', $retired)->first(), "{$retired} is still on the ladder");
        }
    }

    public function test_every_rank_points_at_artwork_the_frontend_serves(): void
    {
        // One convention. The table used to carry both `ranks/*.png` on the
        // storage disk and `/ranks/*.webp` from the frontend; both resolve,
        // which is exactly why nobody noticed it was describing its own
        // artwork two ways.
        foreach (Rank::all() as $rank) {
            $this->assertStringStartsWith('/ranks/', (string) $rank->icon, "{$rank->name} points outside the frontend set");
            $this->assertStringEndsWith('.webp', (string) $rank->icon, "{$rank->name} is not a webp");

            $file = base_path('../frontend/public'.$rank->icon);

            if (is_dir(base_path('../frontend/public/ranks'))) {
                $this->assertFileExists($file, "{$rank->name} names artwork that is not there");
            }
        }
    }

    public function test_a_promotion_lands_on_exactly_one_rung(): void
    {
        $user = User::factory()->create(['xp' => 100]);

        $matching = Rank::where('min_xp', '<=', $user->xp)->orderByDesc('min_xp')->get();

        $this->assertSame('Player', $matching->first()->name);
        // And nothing else sits on 100 to be picked instead.
        $this->assertCount(1, $matching->where('min_xp', 100));
    }
}
