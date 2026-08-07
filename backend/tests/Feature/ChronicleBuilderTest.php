<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Services\Chronicle\ChronicleBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ChronicleBuilderTest extends TestCase
{
    use RefreshDatabase;

    private function game(array $attrs = []): Game
    {
        static $n = 0;
        $n++;

        return Game::create(array_merge([
            'slug' => 'chronicle-game-'.$n,
            'name' => 'Chronicle Game '.$n,
            'released' => '2015-06-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => ['Fantasy'],
        ], $attrs));
    }

    private function chronicle(User $user): object
    {
        app(ChronicleBuilder::class)->build($user);

        $row = DB::table('user_chronicles')->where('user_id', $user->id)->first();
        $this->assertNotNull($row);

        return (object) [
            'taste' => json_decode($row->taste, true),
            'affinities' => json_decode($row->game_affinities, true),
            'negative' => json_decode($row->negative, true),
            'signals_count' => $row->signals_count,
        ];
    }

    public function test_a_loved_genre_outweighs_a_planned_one(): void
    {
        $user = User::factory()->create();
        $rpg = $this->game(['genres' => ['RPG']]);
        $racing = $this->game(['genres' => ['Racing']]);

        // Completed and favourited RPG vs a racing game merely wishlisted.
        DB::table('user_games')->insert([
            ['user_id' => $user->id, 'game_id' => $rpg->id, 'status' => 'completed', 'is_favorite' => true, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'game_id' => $racing->id, 'status' => 'wishlist', 'is_favorite' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $c = $this->chronicle($user);

        $this->assertEquals(1.0, $c->taste['genres']['RPG'], 'the strongest genre normalises to 1');
        $this->assertLessThan($c->taste['genres']['RPG'], $c->taste['genres']['Racing']);
        $this->assertArrayHasKey((string) $rpg->id, array_map(null, $c->affinities) + $c->affinities);
    }

    public function test_dropping_a_game_teaches_the_negative_map(): void
    {
        $user = User::factory()->create();
        $horror = $this->game(['genres' => ['Horror']]);

        DB::table('user_games')->insert([
            ['user_id' => $user->id, 'game_id' => $horror->id, 'status' => 'dropped', 'is_favorite' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $c = $this->chronicle($user);

        $this->assertArrayHasKey('Horror', $c->negative['genres']);
        $this->assertArrayNotHasKey('Horror', $c->taste['genres'] ?? []);
    }

    public function test_old_signals_whisper_and_new_ones_shout(): void
    {
        $user = User::factory()->create();
        $old = $this->game(['genres' => ['Strategy']]);
        $new = $this->game(['genres' => ['Shooter']]);

        // Identical signal strength, two years apart.
        DB::table('user_games')->insert([
            ['user_id' => $user->id, 'game_id' => $old->id, 'status' => 'completed', 'is_favorite' => false, 'created_at' => now()->subYears(2), 'updated_at' => now()->subYears(2)],
            ['user_id' => $user->id, 'game_id' => $new->id, 'status' => 'completed', 'is_favorite' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $c = $this->chronicle($user);

        $this->assertEquals(1.0, $c->taste['genres']['Shooter']);
        $this->assertLessThan(0.35, $c->taste['genres']['Strategy'], 'two years ≈ four half-lives');
    }

    public function test_a_high_own_rating_is_the_loudest_signal(): void
    {
        $user = User::factory()->create();
        $rated = $this->game(['genres' => ['Puzzle']]);
        $completed = $this->game(['genres' => ['Sports']]);

        DB::table('user_games')->insert([
            ['user_id' => $user->id, 'game_id' => $completed->id, 'status' => 'completed', 'is_favorite' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
        DB::table('game_ratings')->insert([
            ['user_id' => $user->id, 'game_id' => $rated->id, 'game_slug' => $rated->slug, 'rating' => 5, 'is_draft' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $c = $this->chronicle($user);

        $this->assertEquals(1.0, $c->taste['genres']['Puzzle'], 'a five-star rating beats a mere completion');
        $this->assertLessThan(1.0, $c->taste['genres']['Sports']);
    }

    public function test_an_empty_user_still_gets_an_honest_row(): void
    {
        $user = User::factory()->create();

        $c = $this->chronicle($user);

        $this->assertSame(0, $c->signals_count);
        $this->assertLessThan(ChronicleBuilder::MIN_SIGNALS, $c->signals_count, 'surfaces must fall back honestly');
    }
}
