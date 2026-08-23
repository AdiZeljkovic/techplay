<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GamerDnaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Gamer DNA, once it started reading the hours.
 *
 * Every figure in it used to come from how many games a shelf held and what
 * status each carried. It never looked at playtime, at when anything was last
 * opened, or at a single platform achievement — so a reader with 3,104 hours
 * behind them, 102 games played and nine years on record was described as
 * "Collector: your shelf grows faster than you can play it".
 *
 * Worse, `played` was missing from the status tally entirely, so on a shelf of
 * 191 the counts summed to 92 and ninety-nine games were invisible to every
 * number below them.
 */
class GamerDnaPlaySignalsTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2018-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, string $slug, string $status, int $hours, array $extra = []): UserGame
    {
        return UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game($slug)->id,
            'status' => $status,
            'hours_played' => $hours,
            'playtime_minutes' => $hours * 60,
        ] + $extra);
    }

    private function dna(User $user): array
    {
        return app(GamerDnaService::class)->build($user);
    }

    public function test_played_games_are_counted_at_all(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'a', 'played', 40);
        $this->shelve($user, 'b', 'played', 12);
        $this->shelve($user, 'c', 'backlog', 0);

        $counts = $this->dna($user)['collection'];

        $this->assertSame(2, $counts['played']);
        // The statuses have to add up to the shelf, or every figure below them
        // is drawn from a different library than the one on screen.
        $sum = $counts['playing'] + $counts['played'] + $counts['completed']
            + $counts['backlog'] + $counts['wishlist'] + $counts['dropped'];
        $this->assertSame($counts['total'], $sum);
    }

    public function test_the_hours_are_read(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'lotro', 'played', 1602, ['last_played_at' => '2024-05-05 10:00:00']);
        $this->shelve($user, 'valheim', 'played', 500, ['last_played_at' => '2021-06-01 10:00:00']);
        $this->shelve($user, 'unopened', 'backlog', 0);

        $play = $this->dna($user)['play'];

        $this->assertSame(2102, $play['hours']);
        $this->assertSame(2, $play['games_played'], 'A game with no minutes on it was never played.');
        $this->assertSame('lotro', $play['deepest']['slug']);
        $this->assertSame(1602, $play['deepest']['hours']);
        // The share is what makes this worth saying: one game, most of a life.
        $this->assertSame(76, $play['deepest']['share']);
    }

    /** Median, not average — one MMO drags a mean far enough to describe nobody. */
    public function test_depth_is_a_median(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'huge', 'played', 1000);
        $this->shelve($user, 'small-one', 'played', 2);
        $this->shelve($user, 'small-two', 'played', 4);

        $this->assertSame(4.0, $this->dna($user)['play']['median_hours']);
    }

    public function test_the_years_come_from_when_games_were_last_opened(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'old', 'played', 10, ['last_played_at' => '2016-01-01 10:00:00']);
        $this->shelve($user, 'newer', 'played', 10, ['last_played_at' => '2021-01-01 10:00:00']);
        $this->shelve($user, 'newest', 'played', 10, ['last_played_at' => '2026-01-01 10:00:00']);

        $span = $this->dna($user)['play']['span'];

        $this->assertSame(2016, $span['from']);
        $this->assertSame(2026, $span['to']);
        $this->assertSame(3, $span['years_active'], 'Years with something in them, not the width of the range.');
    }

    public function test_the_device_split_reports_its_own_coverage(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'attributed', 'played', 100, ['device_playtime' => ['windows' => 5400, 'deck' => 600]]);
        $this->shelve($user, 'older', 'played', 200);

        $devices = $this->dna($user)['play']['devices'];

        $this->assertSame(600, $devices['minutes']['deck']);
        $this->assertSame(100, $devices['placed_hours']);
        $this->assertSame(300, $devices['total_hours'], 'The gap is stated, not hidden.');
    }

    public function test_platform_achievements_are_read(): void
    {
        $user = User::factory()->create();
        $a = $this->shelve($user, 'portal', 'played', 20);
        $b = $this->shelve($user, 'hades', 'played', 30);

        // Portal taken all the way, Hades half done.
        foreach ([[$a->game_id, true], [$a->game_id, true], [$b->game_id, true], [$b->game_id, false]] as [$gameId, $done]) {
            DB::table('steam_achievements')->insert([
                'user_id' => $user->id, 'game_id' => $gameId, 'steam_appid' => 1,
                'api_name' => 'a_'.uniqid(), 'achieved' => $done,
                'achieved_at' => $done ? now() : null,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $platform = $this->dna($user)['platform_achievements'];

        $this->assertSame(4, $platform['total']);
        $this->assertSame(3, $platform['earned']);
        $this->assertSame(2, $platform['games']);
        $this->assertSame(1, $platform['perfected'], 'One game with nothing left in it.');
        $this->assertSame(75, $platform['rate']);
    }

    /**
     * The sentence this whole thing exists to get right.
     */
    public function test_somebody_who_played_their_shelf_is_not_called_a_collector(): void
    {
        $user = User::factory()->create();

        // Ninety-nine played, a handful waiting — the shape of an imported
        // library, and the shape that used to read as "you only buy games".
        for ($i = 0; $i < 20; $i++) {
            $this->shelve($user, "played-{$i}", 'played', 40, ['last_played_at' => '2022-01-01 10:00:00']);
        }
        $this->shelve($user, 'waiting', 'backlog', 0);

        $identity = $this->dna($user)['identity'];

        $this->assertNotContains('Collector', $identity['traits']);
        $this->assertStringNotContainsString(' i ', $identity['blurb'], 'A Bosnian conjunction had been sitting in an English sentence.');
    }

    public function test_a_shelf_of_unplayed_games_still_reads_as_a_collection(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 40; $i++) {
            $this->shelve($user, "boxed-{$i}", 'backlog', 0);
        }

        $this->assertContains('Collector', $this->dna($user)['identity']['traits']);
    }
}
