<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\User;
use App\Models\UserGame;
use App\Services\AchievementService;
use Database\Seeders\AchievementSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AchievementCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function seedCatalog(): void
    {
        $this->seed(AchievementSeeder::class);
    }

    private function service(): AchievementService
    {
        return app(AchievementService::class);
    }

    private function game(string $slug): Game
    {
        return Game::create(['slug' => $slug, 'name' => ucfirst($slug), 'rating' => 4]);
    }

    /**
     * The catalog's whole failure mode was entries pointing at criteria the
     * service cannot resolve — they simply never unlock, silently. Every
     * non-special type must resolve to an int.
     */
    public function test_every_catalog_criteria_type_is_resolvable(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'resolver']);

        $method = new \ReflectionMethod(AchievementService::class, 'resolveValue');
        $method->setAccessible(true);

        $types = Achievement::where('criteria_type', '!=', 'special')
            ->distinct()->pluck('criteria_type');

        $this->assertNotEmpty($types);

        foreach ($types as $type) {
            $this->assertIsInt(
                $method->invoke($this->service(), $user, $type),
                "Criteria type '{$type}' does not resolve — achievements using it can never unlock."
            );
        }
    }

    public function test_catalog_has_no_duplicate_names_or_conflicting_ladders(): void
    {
        $this->seedCatalog();

        $names = Achievement::pluck('name');
        $this->assertSame($names->count(), $names->unique()->count(), 'Duplicate achievement names in the catalog.');

        // The two completion ladders must not both count games_completed
        $this->assertSame('backlog_completed', Achievement::where('name', 'First Blood')->value('criteria_type'));
        $this->assertSame('games_completed', Achievement::where('name', 'Finisher')->value('criteria_type'));

        // The meta ladder must count achievements, not games
        $this->assertSame('achievements_count', Achievement::where('name', 'Shelf Starter')->value('criteria_type'));
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seedCatalog();
        $first = Achievement::count();

        $this->seedCatalog();

        $this->assertSame($first, Achievement::count());
    }

    /** Level N needs (N-1)*1000 XP — the old catalog was off by one full level. */
    public function test_level_five_unlocks_at_four_thousand_xp(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'leveler', 'xp' => 4000]);

        $this->service()->check($user, ['xp']);

        $this->assertTrue($user->achievements()->where('name', 'Level 5')->exists());
    }

    public function test_backlog_completions_are_scored_separately(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'clearer']);

        // completed, but never sat in the backlog
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $this->game('direct')->id,
            'status' => 'completed', 'from_backlog' => false,
        ]);

        $this->service()->check($user, ['games_completed', 'backlog_completed']);

        $this->assertTrue($user->achievements()->where('name', 'Finisher')->exists());
        $this->assertFalse(
            $user->achievements()->where('name', 'First Blood')->exists(),
            'A completion that never passed through the backlog must not score the backlog ladder.'
        );

        // now one that did come out of the backlog
        UserGame::create([
            'user_id' => $user->id, 'game_id' => $this->game('from-pile')->id,
            'status' => 'completed', 'from_backlog' => true,
        ]);

        $this->service()->check($user, ['backlog_completed']);

        $this->assertTrue($user->achievements()->where('name', 'First Blood')->exists());
    }

    public function test_completing_from_backlog_marks_the_entry(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'transitioner']);
        $game = $this->game('pile-game');

        Sanctum::actingAs($user);

        $this->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'backlog'])->assertSuccessful();
        $this->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed'])->assertSuccessful();

        $this->assertTrue(
            (bool) UserGame::where('user_id', $user->id)->where('game_id', $game->id)->value('from_backlog')
        );
    }

    /** Ratings only count when the user actually wrote something. */
    public function test_review_achievements_require_written_and_published_reviews(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'critic']);

        $scoreOnly = $this->game('score-only');
        GameRating::create([
            'user_id' => $user->id, 'game_id' => $scoreOnly->id, 'game_slug' => $scoreOnly->slug,
            'rating' => 5, 'review' => null, 'is_draft' => false,
        ]);
        $draft = $this->game('draft-game');
        GameRating::create([
            'user_id' => $user->id, 'game_id' => $draft->id, 'game_slug' => $draft->slug,
            'rating' => 4, 'review' => 'Unfinished thoughts.', 'is_draft' => true,
        ]);

        $this->service()->check($user, ['ratings_count']);
        $this->assertFalse($user->achievements()->where('name', 'First Opinion')->exists());

        $real = $this->game('real-review');
        GameRating::create([
            'user_id' => $user->id, 'game_id' => $real->id, 'game_slug' => $real->slug,
            'rating' => 5, 'review' => 'A genuinely great game, here is why.', 'is_draft' => false,
        ]);

        $this->service()->check($user, ['ratings_count']);
        $this->assertTrue($user->achievements()->where('name', 'First Opinion')->exists());
    }

    public function test_meta_achievement_unlocks_from_the_same_pass(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'collector', 'xp' => 49000]);

        // four level trophies at once — enough to trip the 5-achievement meta
        // only once the meta sweep counts them
        $user->achievements()->attach(
            Achievement::where('name', 'Friendly')->value('id'),
            ['unlocked_at' => now()]
        );

        $this->service()->check($user, ['xp']);

        $this->assertSame(5, $user->achievements()->whereNotIn('name', ['Shelf Starter'])->count());
        $this->assertTrue(
            $user->achievements()->where('name', 'Shelf Starter')->exists(),
            'Unlocking achievements must be able to satisfy a meta achievement in the same pass.'
        );
    }

    public function test_hidden_achievements_never_unlock(): void
    {
        $this->seedCatalog();
        $user = User::factory()->create(['username' => 'inviter']);

        $squad = Achievement::where('name', 'Squad Goals')->first();
        $this->assertNotNull($squad);
        $this->assertTrue($squad->is_hidden, 'Squad Goals needs referrals, which do not exist yet.');

        $this->service()->checkAllAchievements($user);

        $this->assertFalse($user->achievements()->where('name', 'Squad Goals')->exists());
    }

    public function test_renamed_achievements_keep_their_unlocks(): void
    {
        // simulate the pre-rename state
        $legacy = Achievement::create([
            'name' => 'Big Spender', 'description' => 'Complete 5 orders',
            'points' => 250, 'criteria_type' => 'orders_count', 'criteria_value' => 5,
        ]);
        $user = User::factory()->create(['username' => 'shopper']);
        $user->achievements()->attach($legacy->id, ['unlocked_at' => now()]);

        $this->seedCatalog();

        $this->assertNull(Achievement::where('name', 'Big Spender')->first());
        $this->assertTrue(
            $user->achievements()->where('name', 'Gear Collector')->exists(),
            'Renaming an achievement must not take it away from users who earned it.'
        );
    }
}
