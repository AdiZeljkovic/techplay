<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The details the rewritten game page is built on.
 *
 * Two of these columns are ones the page already reads — `screenshots` and
 * `age_ratings` — and the shapes it reads them in are not negotiable: a
 * different shape is a blank gallery or a missing rating, not an error anyone
 * would see in a log. The rest is the same fill-only rule as the merge, because
 * 90,920 games already carry the store's own captioned screenshots and those
 * are better than IGDB's.
 */
class IgdbDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function raw(string $endpoint, int $id, array $payload): void
    {
        DB::table('igdb_raw')->insert([
            'endpoint' => $endpoint,
            'igdb_id' => $id,
            'payload' => json_encode($payload + ['id' => $id]),
            'fetched_at' => now(),
        ]);
    }

    private function ourGame(string $name, int $igdbId, array $attributes = []): Game
    {
        $game = Game::create(array_merge([
            'name' => $name,
            'slug' => Str::slug($name),
            'released' => '2019-01-01',
        ], $attributes));

        DB::table('game_external_ids')->insert([
            'game_id' => $game->id,
            'provider' => 'igdb',
            'external_id' => (string) $igdbId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $game;
    }

    private function lookups(): void
    {
        $this->raw('game_modes', 1, ['name' => 'Single player']);
        $this->raw('game_modes', 2, ['name' => 'Co-operative']);
        $this->raw('player_perspectives', 1, ['name' => 'First person']);
        $this->raw('languages', 7, ['name' => 'English']);
        $this->raw('languages', 12, ['name' => 'Japanese']);
        $this->raw('language_support_types', 1, ['name' => 'Audio']);
        $this->raw('language_support_types', 2, ['name' => 'Subtitles']);
        $this->raw('language_support_types', 3, ['name' => 'Interface']);
        $this->raw('age_rating_organizations', 1, ['name' => 'ESRB']);
        $this->raw('age_rating_organizations', 2, ['name' => 'PEGI']);
        $this->raw('age_rating_categories', 4, ['rating' => 'E10+', 'organization' => 1]);
        $this->raw('age_rating_categories', 6, ['rating' => '12', 'organization' => 2]);
    }

    public function test_it_fills_how_long_the_game_takes(): void
    {
        $this->lookups();
        $game = $this->ourGame('Long Game', 100);
        $this->raw('games', 100, ['name' => 'Long Game']);
        $this->raw('game_time_to_beats', 1, [
            'game_id' => 100, 'hastily' => 36000, 'normally' => 86400, 'completely' => 180000, 'count' => 412,
        ]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $this->assertSame(86400, $game->fresh()->time_to_beat['normally'], 'seconds are kept as given');

        /* Hours on the way out — 86,400 seconds is a puzzle, 24 hours is an answer. */
        $this->getJson('/api/v1/games/long-game')
            ->assertOk()
            ->assertJsonPath('time_to_beat.normally', 24)
            ->assertJsonPath('time_to_beat.hastily', 10)
            ->assertJsonPath('time_to_beat.count', 412);
    }

    /**
     * `GameController` picks the ESRB entry out by the exact string "ESRB
     * Rating", and the 8,391 ratings already in the table are spelled that way.
     * Writing a bare "ESRB" would empty that field on every game this touches.
     */
    public function test_age_ratings_are_written_the_way_the_page_reads_them(): void
    {
        $this->lookups();
        $this->ourGame('Rated Game', 100);
        $this->raw('games', 100, ['name' => 'Rated Game', 'age_ratings' => [50, 51]]);
        $this->raw('age_ratings', 50, ['organization' => 1, 'rating_category' => 4]);
        $this->raw('age_ratings', 51, ['organization' => 2, 'rating_category' => 6]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $response = $this->getJson('/api/v1/games/rated-game')->assertOk();

        $this->assertSame(
            [
                ['rating_name' => 'E10+', 'rating_system_name' => 'ESRB Rating'],
                ['rating_name' => '12', 'rating_system_name' => 'PEGI Rating'],
            ],
            $response->json('age_ratings'),
        );

        $this->assertSame('E10+', $response->json('esrb_rating.name'), 'the ESRB shortcut still resolves');
    }

    /** One row per language, three booleans — the table the page draws. */
    public function test_languages_come_out_as_one_row_each(): void
    {
        $this->lookups();
        $this->ourGame('Spoken Game', 100);
        $this->raw('games', 100, ['name' => 'Spoken Game']);
        $this->raw('language_supports', 1, ['game' => 100, 'language' => 7, 'language_support_type' => 1]);
        $this->raw('language_supports', 2, ['game' => 100, 'language' => 7, 'language_support_type' => 2]);
        $this->raw('language_supports', 3, ['game' => 100, 'language' => 12, 'language_support_type' => 2]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $languages = $this->getJson('/api/v1/games/spoken-game')->json('languages');

        $this->assertSame(
            [
                ['name' => 'English', 'audio' => true, 'subtitles' => true, 'interface' => false],
                ['name' => 'Japanese', 'audio' => false, 'subtitles' => true, 'interface' => false],
            ],
            $languages,
        );
    }

    /**
     * A game has one multiplayer row per platform. Split-screen on any of them
     * is the answer to "does this have split-screen", which is what a reader
     * means when they ask.
     */
    public function test_multiplayer_is_true_if_it_is_true_on_any_platform(): void
    {
        $this->lookups();
        $this->ourGame('Couch Game', 100);
        $this->raw('games', 100, ['name' => 'Couch Game']);
        $this->raw('multiplayer_modes', 1, ['game' => 100, 'splitscreen' => false, 'onlinecoop' => true]);
        $this->raw('multiplayer_modes', 2, ['game' => 100, 'splitscreen' => true, 'offlinemax' => 4]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $multiplayer = $this->getJson('/api/v1/games/couch-game')->json('multiplayer');

        $this->assertTrue($multiplayer['splitscreen']);
        $this->assertTrue($multiplayer['onlinecoop']);
        $this->assertSame(4, $multiplayer['offlinemax']);
    }

    /** Screenshots go in the shape the gallery already reads. */
    public function test_screenshots_keep_the_shape_the_gallery_reads(): void
    {
        $this->lookups();
        $this->ourGame('Pretty Game', 100);
        $this->raw('games', 100, ['name' => 'Pretty Game']);
        $this->raw('screenshots', 1, ['game' => 100, 'image_id' => 'scabc', 'width' => 1920, 'height' => 1080]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $shot = $this->getJson('/api/v1/games/pretty-game')->json('screenshots_count');
        $stored = Game::where('slug', 'pretty-game')->value('screenshots');

        $this->assertSame(1, $shot);
        $this->assertStringContainsString('scabc', $stored[0]['image']);
        $this->assertArrayHasKey('thumbnail_image', $stored[0]);
        $this->assertSame(1920, $stored[0]['width']);
    }

    /** 90,920 games carry the store's own captioned pictures. Those stay. */
    public function test_it_does_not_replace_screenshots_we_already_have(): void
    {
        $this->lookups();
        $ours = [['image' => 'https://store.example/one.jpg', 'caption' => 'From the store']];
        $this->ourGame('Pretty Game', 100, ['screenshots' => $ours]);
        $this->raw('games', 100, ['name' => 'Pretty Game']);
        $this->raw('screenshots', 1, ['game' => 100, 'image_id' => 'scabc', 'width' => 1920, 'height' => 1080]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $this->assertSame($ours, Game::where('slug', 'pretty-game')->value('screenshots'));
    }

    /** A similar game we do not carry is dropped, not linked into nowhere. */
    public function test_similar_games_resolve_to_pages_we_actually_have(): void
    {
        $this->lookups();
        $this->ourGame('Original', 100);
        $this->ourGame('We Have This One', 101);

        $this->raw('games', 100, ['name' => 'Original', 'similar_games' => [101, 999]]);
        $this->raw('games', 101, ['name' => 'We Have This One']);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $similar = $this->getJson('/api/v1/games/original')->json('similar_games');

        /* The cover comes along on the way out rather than being stored: a copy
           written at import time goes stale, and without one the shelf draws a
           row of empty black cards. */
        $this->assertSame(
            [['name' => 'We Have This One', 'slug' => 'we-have-this-one', 'cover_url' => null]],
            $similar,
        );
    }

    /** And it is the current cover, not one copied at import time. */
    public function test_a_similar_game_carries_its_cover(): void
    {
        $this->lookups();
        $this->ourGame('Original', 100);
        $this->ourGame('We Have This One', 101, ['cover_url' => 'https://example.test/cover.jpg']);

        $this->raw('games', 100, ['name' => 'Original', 'similar_games' => [101]]);
        $this->raw('games', 101, ['name' => 'We Have This One']);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $this->getJson('/api/v1/games/original')
            ->assertOk()
            ->assertJsonPath('similar_games.0.cover_url', 'https://example.test/cover.jpg');
    }

    /** Modes and perspectives come out named, not numbered. */
    public function test_modes_and_perspectives_are_named(): void
    {
        $this->lookups();
        $this->ourGame('Played Game', 100);
        $this->raw('games', 100, [
            'name' => 'Played Game',
            'game_modes' => [1, 2],
            'player_perspectives' => [1],
        ]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $response = $this->getJson('/api/v1/games/played-game')->assertOk();

        $this->assertSame(['Single player', 'Co-operative'], $response->json('game_modes'));
        $this->assertSame(['First person'], $response->json('player_perspectives'));
    }

    public function test_without_apply_nothing_is_written(): void
    {
        $this->lookups();
        $game = $this->ourGame('Long Game', 100);
        $this->raw('games', 100, ['name' => 'Long Game']);
        $this->raw('game_time_to_beats', 1, ['game_id' => 100, 'normally' => 86400, 'count' => 4]);

        $this->artisan('igdb:details')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertNull($game->fresh()->time_to_beat);
    }

    /** A locked column is left alone here as everywhere else. */
    public function test_a_locked_column_is_respected(): void
    {
        $this->lookups();
        $game = $this->ourGame('Long Game', 100, ['locked_fields' => ['time_to_beat']]);
        $this->raw('games', 100, ['name' => 'Long Game']);
        $this->raw('game_time_to_beats', 1, ['game_id' => 100, 'normally' => 86400, 'count' => 4]);

        $this->artisan('igdb:details', ['--apply' => true])->assertSuccessful();

        $this->assertNull($game->fresh()->time_to_beat);
    }
}
