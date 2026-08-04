<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\PlaySession;
use App\Models\User;
use App\Models\UserGame;
use App\Services\WrappedService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class WrappedTest extends TestCase
{
    use RefreshDatabase;

    private int $year;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->year = (int) now()->year;
    }

    private function game(array $attrs = []): Game
    {
        static $n = 0;
        $n++;

        return Game::create(array_merge([
            'slug' => 'wrapped-game-'.$n,
            'name' => 'Wrapped Game '.$n,
            'genre_names' => ['Role-playing (RPG)'],
            'background_image' => 'https://example.com/'.$n.'.jpg',
        ], $attrs));
    }

    private function played(User $user, Game $game, string $status, ?string $completedAt = null, int $hours = 0): void
    {
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id, 'status' => $status,
            'hours_played' => $hours, 'completed_at' => $completedAt,
        ]);
    }

    public function test_the_year_counts_only_what_happened_inside_it(): void
    {
        $user = User::factory()->create();

        $this->played($user, $this->game(), 'completed', now()->toDateString());
        // Finished last year — outside the window.
        $old = $this->game();
        $this->played($user, $old, 'completed', now()->subYear()->toDateString());
        UserGame::where('game_id', $old->id)->update(['updated_at' => now()->subYear()]);

        $data = app(WrappedService::class)->build($user, $this->year);
        $completed = collect($data['stats'])->firstWhere('key', 'games_completed');

        $this->assertSame(1, $completed['value']);
        $this->assertTrue($data['has_data']);
    }

    public function test_a_delta_is_absent_when_last_year_holds_nothing(): void
    {
        $user = User::factory()->create();
        $this->played($user, $this->game(), 'completed', now()->toDateString());

        $stats = collect(app(WrappedService::class)->build($user, $this->year)['stats']);

        $this->assertNull(
            $stats->firstWhere('key', 'games_completed')['delta_percent'],
            'a jump from nothing is not a percentage'
        );
    }

    public function test_a_delta_appears_once_there_is_something_to_compare(): void
    {
        $user = User::factory()->create();

        // Two completions last year…
        foreach (range(1, 2) as $_) {
            $game = $this->game();
            $this->played($user, $game, 'completed', now()->subYear()->toDateString());
            UserGame::where('game_id', $game->id)->update(['updated_at' => now()->subYear()]);
        }

        // …three this year.
        foreach (range(1, 3) as $_) {
            $this->played($user, $this->game(), 'completed', now()->toDateString());
        }

        $stats = collect(app(WrappedService::class)->build($user, $this->year)['stats']);
        $completed = $stats->firstWhere('key', 'games_completed');

        $this->assertSame(3, $completed['value']);
        $this->assertSame(2, $completed['previous']);
        $this->assertSame(50, $completed['delta_percent']);
    }

    public function test_hours_and_streak_come_from_logged_sessions(): void
    {
        $user = User::factory()->create();
        $game = $this->game();
        $this->played($user, $game, 'playing');

        // Four consecutive days, then a gap, then two.
        foreach ([0, 1, 2, 3, 6, 7] as $offset) {
            PlaySession::create([
                'user_id' => $user->id, 'game_id' => $game->id,
                'played_on' => now()->startOfYear()->addDays($offset)->toDateString(),
                'minutes' => 60,
            ]);
        }

        $stats = collect(app(WrappedService::class)->build($user, $this->year)['stats']);

        $this->assertSame(6, $stats->firstWhere('key', 'hours')['value']);
        $this->assertSame(4, $stats->firstWhere('key', 'streak')['value'], 'the longest run, not the total days');
    }

    public function test_top_games_rank_by_logged_hours_and_the_dna_reads_the_genres(): void
    {
        $user = User::factory()->create();

        $big = $this->game(['name' => 'The Long One', 'genre_names' => ['Role-playing (RPG)']]);
        $small = $this->game(['name' => 'The Short One', 'genre_names' => ['Puzzle']]);
        $this->played($user, $big, 'playing');
        $this->played($user, $small, 'playing');

        PlaySession::create(['user_id' => $user->id, 'game_id' => $big->id, 'played_on' => now()->toDateString(), 'minutes' => 600]);
        PlaySession::create(['user_id' => $user->id, 'game_id' => $small->id, 'played_on' => now()->toDateString(), 'minutes' => 60]);

        $data = app(WrappedService::class)->build($user, $this->year);

        $this->assertSame('The Long One', $data['top_games'][0]['name']);
        $this->assertSame(10, $data['top_games'][0]['hours']);
        $this->assertSame('Role-playing (RPG)', $data['dna']['genres'][0]['name']);
        $this->assertSame(50, $data['dna']['genres'][0]['percent']);
        $this->assertContains('Puzzle', $data['dna']['tags']);
    }

    public function test_the_timeline_only_marks_things_that_happened(): void
    {
        $user = User::factory()->create();
        $game = $this->game();
        $this->played($user, $game, 'completed', now()->startOfYear()->addDays(20)->toDateString());

        PlaySession::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'played_on' => now()->startOfYear()->addDays(40)->toDateString(), 'minutes' => 420,
        ]);

        $timeline = collect(app(WrappedService::class)->build($user, $this->year)['timeline']);

        $this->assertTrue($timeline->contains('key', 'first_completion'));
        $this->assertTrue($timeline->contains('key', 'longest_session'));
        $this->assertFalse($timeline->contains('key', 'review'), 'no review, no marker');
        $this->assertSame('7h', $timeline->firstWhere('key', 'longest_session')['detail'] ? substr($timeline->firstWhere('key', 'longest_session')['detail'], 0, 2) : '');
    }

    public function test_percentiles_are_withheld_while_the_population_is_tiny(): void
    {
        $user = User::factory()->create();
        $this->played($user, $this->game(), 'completed', now()->toDateString());

        $percentiles = app(WrappedService::class)->build($user, $this->year)['percentiles'];

        $this->assertFalse($percentiles['available']);
        $this->assertSame([], $percentiles['items']);
    }

    public function test_the_archetype_is_earned_from_the_year_not_picked_from_a_list(): void
    {
        $user = User::factory()->create();

        // Finishes most of what they start → Relentless; RPGs → Explorer.
        foreach (range(1, 3) as $_) {
            $this->played($user, $this->game(['genre_names' => ['Role-playing (RPG)']]), 'completed', now()->toDateString());
        }

        $archetype = app(WrappedService::class)->build($user, $this->year)['archetype'];

        $this->assertSame('Relentless Explorer', $archetype['name']);
        $this->assertStringContainsString('finish what you start', $archetype['blurb']);
    }

    public function test_an_empty_year_says_so_rather_than_faking_a_recap(): void
    {
        $user = User::factory()->create();

        $data = app(WrappedService::class)->build($user, $this->year);

        $this->assertFalse($data['has_data']);
        $this->assertSame([], $data['top_games']);
        $this->assertSame([], $data['timeline']);
        $this->assertSame('Year One', $data['archetype']['name']);
    }

    public function test_the_endpoint_respects_privacy_and_clamps_the_year(): void
    {
        $user = User::factory()->create([
            'username' => 'adi',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        $this->getJson("/api/v1/users/adi/wrapped/{$this->year}")->assertStatus(403);

        $user->update(['profile_visibility' => User::VISIBILITY_PUBLIC]);

        // A year in the future is clamped to now rather than returning nonsense.
        $this->getJson('/api/v1/users/adi/wrapped/2099')
            ->assertOk()
            ->assertJsonPath('data.year', $this->year);
    }

    public function test_reviews_and_achievements_land_in_the_moments(): void
    {
        $user = User::factory()->create();
        $game = $this->game(['name' => 'Reviewed Game']);
        $this->played($user, $game, 'completed', now()->toDateString());

        GameRating::create([
            'user_id' => $user->id, 'game_id' => $game->id, 'game_slug' => $game->slug,
            'rating' => 9.5, 'review' => 'A year-defining run.', 'is_draft' => false,
        ]);

        $achievement = Achievement::create([
            'name' => 'Completionist', 'description' => 'x', 'points' => 100,
            'criteria_type' => 'special', 'criteria_value' => 1, 'is_hidden' => false,
        ]);
        $user->achievements()->attach($achievement->id, ['unlocked_at' => now()]);

        $moments = collect(app(WrappedService::class)->build($user, $this->year)['moments'])->keyBy('key');

        $this->assertSame('Completionist', $moments['achievement']['value']);
        $this->assertStringContainsString('100 pts', $moments['achievement']['note']);
        $this->assertSame('Reviewed Game', $moments['review']['value']);
    }
}
