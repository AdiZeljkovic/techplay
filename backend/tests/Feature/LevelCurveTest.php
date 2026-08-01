<?php

namespace Tests\Feature;

use App\Services\LevelService;
use Tests\TestCase;

class LevelCurveTest extends TestCase
{
    private LevelService $levels;

    protected function setUp(): void
    {
        parent::setUp();
        $this->levels = new LevelService;
    }

    /** Every rank must land on exactly the level the ladder promises. */
    public static function rankLadder(): array
    {
        return [
            'Newcomer' => [0, 1],
            'Player' => [100, 2],
            'Rookie' => [300, 3],
            'Bronze' => [600, 5],
            'Silver' => [1000, 7],
            'Gold' => [2000, 11],
            'Platinum' => [3500, 15],
            'Diamond' => [5000, 19],
            'Master' => [7500, 24],
            'Grandmaster' => [10000, 28],
            'Challenger' => [15000, 35],
            'Elite' => [20000, 41],
            'Veteran' => [30000, 51],
            'Legend' => [45000, 63],
            'Mythic' => [60000, 74],
            'Immortal' => [80000, 86],
            'Ascendant' => [100000, 96],
            'Radiant' => [150000, 119],
            'Apex' => [250000, 154],
            'Eternal' => [500000, 220],
        ];
    }

    /**
     * @dataProvider rankLadder
     */
    public function test_each_rank_threshold_lands_on_its_level(int $xp, int $expected): void
    {
        $this->assertSame($expected, $this->levels->forXp($xp));
    }

    public function test_the_curve_never_goes_backwards(): void
    {
        $previous = 0;

        foreach ([0, 50, 99, 100, 500, 999, 1000, 4200, 9999, 22_500, 77_000, 260_000, 900_000] as $xp) {
            $level = $this->levels->forXp($xp);
            $this->assertGreaterThanOrEqual($previous, $level, "Level dropped at {$xp} XP");
            $previous = $level;
        }
    }

    public function test_xp_for_level_inverts_the_curve(): void
    {
        foreach ([1, 2, 5, 7, 11, 19, 41, 63, 96, 154, 220, 260] as $level) {
            $xp = $this->levels->xpForLevel($level);
            $this->assertSame(
                $level,
                $this->levels->forXp($xp),
                "xpForLevel({$level}) = {$xp} did not resolve back to level {$level}"
            );
        }
    }

    public function test_progress_reports_the_band_you_are_inside(): void
    {
        // Silver is level 7 at 1000 XP; Gold is level 11 at 2000 XP,
        // so levels cost 250 XP through that band.
        $progress = $this->levels->progress(1125);

        $this->assertSame(7, $progress['level']);
        $this->assertSame(1000, $progress['level_start']);
        $this->assertSame(1250, $progress['next_level_xp']);
        $this->assertSame(50, $progress['percent']);
    }

    public function test_levels_keep_climbing_past_the_final_rank(): void
    {
        $this->assertSame(220, $this->levels->forXp(500_000));
        $this->assertSame(221, $this->levels->forXp(503_788));
        $this->assertGreaterThan(220, $this->levels->forXp(1_000_000));
    }

    public function test_negative_and_null_xp_are_level_one(): void
    {
        $this->assertSame(1, $this->levels->forXp(null));
        $this->assertSame(1, $this->levels->forXp(-500));
    }
}
