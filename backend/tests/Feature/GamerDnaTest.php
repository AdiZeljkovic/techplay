<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GamerDnaTest extends TestCase
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
            'slug' => 'game-'.$n,
            'name' => 'Game '.$n,
            'released' => '2018-01-01',
            'genres' => ['Action'],
            'tags' => [],
        ], $attrs));
    }

    private function own(User $user, Game $game, string $status = 'completed', array $extra = []): void
    {
        UserGame::create(array_merge([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => $status,
        ], $extra));
    }

    public function test_it_reads_completion_off_the_owned_collection_and_ignores_the_wishlist(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $this->own($user, $this->game(), 'completed');
        $this->own($user, $this->game(), 'backlog');
        // A wishlisted game is not owned — it must not drag completion down.
        $this->own($user, $this->game(), 'wishlist');

        $data = $this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data');

        $this->assertSame(50, $data['collection']['completion_rate']);
        $axis = collect($data['fingerprint'])->firstWhere('key', 'finishing');
        $this->assertSame(50, $axis['value']);
        $this->assertTrue($axis['measured']);
    }

    public function test_the_taste_axes_follow_the_genre_mix(): void
    {
        $strategist = User::factory()->create(['username' => 'strat']);
        foreach (range(1, 4) as $_) {
            $this->own($strategist, $this->game(['genres' => ['Strategy / tactics']]));
        }

        $reader = User::factory()->create(['username' => 'reader']);
        foreach (range(1, 4) as $_) {
            $this->own($reader, $this->game(['genres' => ['Adventure'], 'tags' => ['Visual novel']]));
        }

        $focus = fn (string $u) => collect(
            $this->getJson("/api/v1/users/{$u}/gamer-dna")->assertOk()->json('data.fingerprint')
        )->firstWhere('key', 'focus')['value'];

        // Story sits at 0, systems at 100 — the two libraries must land apart.
        $this->assertGreaterThan(70, $focus('strat'));
        $this->assertLessThan(30, $focus('reader'));
    }

    public function test_release_years_place_the_collection_on_the_era_line(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        $this->own($user, $this->game(['released' => '1996-05-01']));
        $this->own($user, $this->game(['released' => '2023-05-01']));

        $data = $this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data');

        $eras = collect($data['eras'])->keyBy('key');
        $this->assertSame(50, $eras['retro']['percent']);
        $this->assertSame(50, $eras['ps5']['percent']);
        $this->assertSame(0, $eras['ps3']['percent']);

        $era = collect($data['fingerprint'])->firstWhere('key', 'era');
        $this->assertStringContainsString('Average release', $era['basis']);
    }

    public function test_an_empty_collection_produces_neutral_axes_rather_than_an_error(): void
    {
        User::factory()->create(['username' => 'adi']);

        $data = $this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data');

        $this->assertSame(0, $data['collection']['total']);
        $this->assertCount(5, $data['fingerprint']);
        foreach ($data['fingerprint'] as $axis) {
            $this->assertGreaterThanOrEqual(0, $axis['value']);
            $this->assertLessThanOrEqual(100, $axis['value']);
        }
        $this->assertCount(3, $data['identity']['traits']);
    }

    public function test_the_dna_score_is_the_sum_of_its_published_breakdown(): void
    {
        $user = User::factory()->create(['username' => 'adi', 'xp' => 5000]);
        foreach (range(1, 6) as $_) {
            $this->own($user, $this->game(), 'completed', ['is_favorite' => true]);
        }

        $score = $this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data.score');

        $this->assertSame(array_sum(array_column($score['breakdown'], 'value')), $score['value']);
        $this->assertSame(10000, $score['max']);
        $this->assertGreaterThan(0, $score['value']);

        // And it is written back, so the percentile has something to compare.
        $this->assertSame($score['value'], (int) $user->fresh()->dna_score);
    }

    public function test_the_percentile_is_withheld_until_enough_profiles_carry_a_score(): void
    {
        User::factory()->create(['username' => 'adi']);

        $this->assertNull(
            $this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data.score.percentile')
        );
    }

    public function test_archetypes_level_up_off_real_collection_numbers(): void
    {
        $user = User::factory()->create(['username' => 'adi']);
        foreach (range(1, 6) as $_) {
            $this->own($user, $this->game(['genres' => ['Role-playing (RPG)']]), 'completed');
        }

        $archetypes = collect($this->getJson('/api/v1/users/adi/gamer-dna')->assertOk()->json('data.archetypes'))
            ->keyBy('key');

        $this->assertSame(1, $archetypes['lore_hunter']['level']);
        $this->assertSame(10, $archetypes['lore_hunter']['next_at']);
        $this->assertSame(6, $archetypes['lore_hunter']['value']);
        $this->assertLessThanOrEqual(4, $archetypes->count());
    }

    public function test_a_private_profile_keeps_its_dna_to_itself(): void
    {
        $user = User::factory()->create([
            'username' => 'adi',
            'profile_visibility' => User::VISIBILITY_FRIENDS,
        ]);

        $this->getJson('/api/v1/users/adi/gamer-dna')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/v1/users/adi/gamer-dna')->assertOk();
    }
}
