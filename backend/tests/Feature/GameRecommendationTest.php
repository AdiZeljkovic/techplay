<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\GameRecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GameRecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function game(array $attrs = []): Game
    {
        static $n = 0;
        $n++;

        return Game::create(array_merge([
            'slug' => 'rec-game-'.$n,
            'name' => 'Rec Game '.$n,
            'released' => '2018-01-01',
            'genre_names' => ['Action'],
            'rating' => 4.2,
            'background_image' => 'https://example.com/'.$n.'.jpg',
        ], $attrs));
    }

    private function own(User $user, Game $game, string $status = 'completed', bool $favorite = false): void
    {
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $game->id,
            'status' => $status, 'is_favorite' => $favorite,
        ]);
    }

    public function test_recommendations_follow_the_genres_the_player_actually_finishes(): void
    {
        $user = User::factory()->create();

        // A shelf full of finished RPGs.
        foreach (range(1, 4) as $_) {
            $this->own($user, $this->game(['genre_names' => ['Role-playing (RPG)']]), 'completed');
        }

        $rpg = $this->game(['name' => 'Unowned RPG', 'genre_names' => ['Role-playing (RPG)'], 'rating' => 4.4]);
        $sport = $this->game(['name' => 'Unowned Sports', 'genre_names' => ['Sports'], 'rating' => 4.4]);

        $picks = collect(app(GameRecommendationService::class)->recommend($user));
        $names = $picks->pluck('name');

        $this->assertTrue($names->contains('Unowned RPG'));
        $this->assertGreaterThan(
            $picks->firstWhere('name', 'Unowned Sports')['match_score'] ?? 0,
            $picks->firstWhere('name', 'Unowned RPG')['match_score'],
            'the genre you finish outscores the one you never touch'
        );
        $this->assertNotNull($rpg);
        $this->assertNotNull($sport);
    }

    public function test_a_game_you_already_have_is_never_recommended(): void
    {
        $user = User::factory()->create();
        $owned = $this->game(['name' => 'Already Mine', 'genre_names' => ['Action']]);
        $this->own($user, $owned, 'backlog');
        $this->game(['name' => 'Fresh Blood', 'genre_names' => ['Action']]);

        $names = collect(app(GameRecommendationService::class)->recommend($user))->pluck('name');

        $this->assertFalse($names->contains('Already Mine'));
        $this->assertTrue($names->contains('Fresh Blood'));
    }

    public function test_the_match_score_is_the_sum_of_its_published_breakdown(): void
    {
        $user = User::factory()->create();
        $this->own($user, $this->game(['genre_names' => ['Adventure']]), 'completed');
        $this->game(['name' => 'Scored', 'genre_names' => ['Adventure'], 'rating' => 4.6]);

        $pick = collect(app(GameRecommendationService::class)->recommend($user))->firstWhere('name', 'Scored');

        $this->assertNotNull($pick);
        $sum = collect($pick['breakdown'])->sum('value');
        $max = collect($pick['breakdown'])->sum('max');

        $this->assertSame(100, $max, 'the weights add up to a real total');
        // Rounding per component allows a point of drift; the shape must hold.
        $this->assertEqualsWithDelta($pick['match_score'], round($sum / $max * 100), 2);
        $this->assertNotEmpty($pick['reasons']);
    }

    public function test_players_with_the_same_shelf_pull_a_game_up(): void
    {
        $user = User::factory()->create();

        $shared = collect(range(1, 3))->map(fn () => $this->game(['genre_names' => ['Puzzle']]));
        foreach ($shared as $game) {
            $this->own($user, $game, 'playing');
        }

        // A game only peers own, in a genre the user has never touched.
        $peerPick = $this->game(['name' => 'Peer Favourite', 'genre_names' => ['Simulation'], 'rating' => 3.6]);

        foreach (range(1, 5) as $_) {
            $peer = User::factory()->create();
            foreach ($shared as $game) {
                $this->own($peer, $game, 'playing');
            }
            $this->own($peer, $peerPick, 'playing');
        }

        $pick = collect(app(GameRecommendationService::class)->recommend($user))->firstWhere('name', 'Peer Favourite');

        $this->assertNotNull($pick, 'a peer favourite reaches the list even outside your genres');
        $this->assertGreaterThan(0, collect($pick['breakdown'])->firstWhere('key', 'peers')['value']);
        $this->assertTrue(
            collect($pick['reasons'])->contains(fn (string $r) => str_contains($r, 'your taste')),
            'and the card says why'
        );
    }

    public function test_a_genre_filter_is_honoured_strictly(): void
    {
        $user = User::factory()->create();
        $this->own($user, $this->game(['genre_names' => ['Action']]), 'completed');

        $this->game(['name' => 'Strategy Pick', 'genre_names' => ['Strategy / tactics'], 'rating' => 4.5]);
        $this->game(['name' => 'Action Pick', 'genre_names' => ['Action'], 'rating' => 4.9]);

        $names = collect(app(GameRecommendationService::class)->recommend($user, ['genres' => ['Strategy / tactics']]))
            ->pluck('name');

        $this->assertTrue($names->contains('Strategy Pick'));
        $this->assertFalse($names->contains('Action Pick'), 'a filter that leaks is not a filter');
    }

    public function test_the_summary_reads_the_shelf_and_scores_its_health(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 3) as $_) {
            $this->own($user, $this->game(['genre_names' => ['Action']]), 'completed');
        }
        $this->own($user, $this->game(['genre_names' => ['Action']]), 'backlog');

        $summary = app(GameRecommendationService::class)->summary($user);

        $this->assertSame(4, $summary['library']);
        $this->assertSame(1, $summary['backlog']);
        $this->assertSame(3, $summary['completed']);
        $this->assertSame(75, $summary['completion_rate']);
        $this->assertSame(['Action'], $summary['top_genres']);
        $this->assertGreaterThan(60, $summary['health']);
        $this->assertStringContainsString('progress', $summary['health_note']);
    }

    public function test_an_empty_shelf_says_so_instead_of_pretending(): void
    {
        $user = User::factory()->create();

        $summary = app(GameRecommendationService::class)->summary($user);

        $this->assertSame(0, $summary['library']);
        $this->assertSame([], $summary['top_genres']);
        $this->assertStringContainsString('Add a few games', $summary['health_note']);
    }

    public function test_the_endpoint_returns_the_page_in_one_call(): void
    {
        $user = User::factory()->create();
        $this->own($user, $this->game(['genre_names' => ['Action']]), 'completed');
        $this->game(['name' => 'Suggested', 'genre_names' => ['Action'], 'rating' => 4.7]);

        $data = $this->actingAs($user)->getJson('/api/v1/backlog/recommendations')->assertOk()->json('data');

        $this->assertArrayHasKey('summary', $data);
        $this->assertArrayHasKey('genres', $data);
        $this->assertArrayHasKey('weights', $data);
        $this->assertNotEmpty($data['recommendations']);
        $this->assertSame('Suggested', $data['recommendations'][0]['name']);
    }
}
