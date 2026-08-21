<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Store links, official sites, and what a game is part of.
 *
 * The load-bearing test here is the one that checks `game_store_links` is left
 * alone. That table belongs to the release aggregator, which scores games by
 * counting it and admits them to the release calendar by it — writing IGDB's
 * 172,590 Steam links into it would move the calendar and every hype score on
 * the site as a side effect of adding buy buttons.
 */
class IgdbLinksTest extends TestCase
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

    private function sources(): void
    {
        $this->raw('external_game_sources', 1, ['name' => 'Steam']);
        $this->raw('external_game_sources', 5, ['name' => 'GOG']);
        $this->raw('external_game_sources', 14, ['name' => 'Twitch']);
        $this->raw('website_types', 1, ['type' => 'Official Website']);
        $this->raw('website_types', 3, ['type' => 'Wikipedia']);
        $this->raw('website_types', 5, ['type' => 'Discord']);
    }

    public function test_it_writes_store_links_under_names_people_recognise(): void
    {
        $this->sources();
        $game = $this->ourGame('Bought Game', 100);

        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 1, 'uid' => '12345', 'url' => 'https://store.steampowered.com/app/12345']);
        $this->raw('external_games', 2, ['game' => 100, 'external_game_source' => 5, 'url' => 'https://www.gog.com/game/bought']);

        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseHas('game_links', ['game_id' => $game->id, 'service' => 'Steam', 'kind' => 'store']);
        $this->assertDatabaseHas('game_links', ['game_id' => $game->id, 'service' => 'GOG', 'kind' => 'store']);
    }

    /**
     * Twitch carries more rows than any other source and is a stream, not a
     * shop. "Where to get it" has to mean where to get it.
     */
    public function test_a_source_that_is_not_a_shop_is_not_a_store_link(): void
    {
        $this->sources();
        $this->ourGame('Streamed Game', 100);

        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 14, 'url' => 'https://twitch.tv/directory/game/x']);

        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertDatabaseMissing('game_links', ['service' => 'Twitch', 'kind' => 'store']);
    }

    /**
     * The aggregator's table is not ours to fill. It scores forty points per
     * distinct store and admits games to the calendar by counting rows.
     */
    public function test_it_never_touches_the_aggregators_store_table(): void
    {
        $this->sources();
        $this->ourGame('Bought Game', 100);
        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 1, 'url' => 'https://store.steampowered.com/app/12345']);

        $before = DB::table('game_store_links')->count();

        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertSame($before, DB::table('game_store_links')->count());
    }

    /** The official site goes into the column the page already reads. */
    public function test_the_official_site_fills_the_website_column(): void
    {
        $this->sources();
        $game = $this->ourGame('Sited Game', 100);

        $this->raw('websites', 1, ['game' => 100, 'type' => 1, 'url' => 'https://example.com/game']);
        $this->raw('websites', 2, ['game' => 100, 'type' => 5, 'url' => 'https://discord.gg/abc']);

        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertSame('https://example.com/game', $game->fresh()->website);
        $this->assertDatabaseHas('game_links', ['game_id' => $game->id, 'service' => 'Discord', 'kind' => 'social']);
    }

    /** A site somebody put there by hand is not replaced. */
    public function test_it_does_not_replace_a_website_we_already_have(): void
    {
        $this->sources();
        $game = $this->ourGame('Sited Game', 100, ['website' => 'https://ours.example/game']);
        $this->raw('websites', 1, ['game' => 100, 'type' => 1, 'url' => 'https://igdb.example/game']);

        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertSame('https://ours.example/game', $game->fresh()->website);
    }

    /** One row per service — a game listed twice on one shop is one shop. */
    public function test_a_second_run_adds_nothing(): void
    {
        $this->sources();
        $this->ourGame('Bought Game', 100);
        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 1, 'url' => 'https://store.steampowered.com/app/1']);
        $this->raw('external_games', 2, ['game' => 100, 'external_game_source' => 1, 'url' => 'https://store.steampowered.com/app/2']);

        $this->artisan('igdb:links', ['--apply' => true]);
        $this->artisan('igdb:links', ['--apply' => true])->assertSuccessful();

        $this->assertSame(1, DB::table('game_links')->where('service', 'Steam')->count());
    }

    public function test_without_apply_nothing_is_written(): void
    {
        $this->sources();
        $this->ourGame('Bought Game', 100);
        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 1, 'url' => 'https://store.steampowered.com/app/1']);

        $this->artisan('igdb:links')
            ->expectsOutputToContain('Nista nije upisano')
            ->assertSuccessful();

        $this->assertSame(0, DB::table('game_links')->count());
    }

    /** The page gets them grouped by what they are for. */
    public function test_the_api_groups_links_by_what_they_are_for(): void
    {
        $this->sources();
        $this->ourGame('Bought Game', 100);
        $this->raw('external_games', 1, ['game' => 100, 'external_game_source' => 1, 'url' => 'https://store.steampowered.com/app/1']);
        $this->raw('websites', 1, ['game' => 100, 'type' => 5, 'url' => 'https://discord.gg/abc']);

        $this->artisan('igdb:links', ['--apply' => true]);

        $this->getJson('/api/v1/games/bought-game')
            ->assertOk()
            ->assertJsonPath('links.store.0.service', 'Steam')
            ->assertJsonPath('links.social.0.service', 'Discord');
    }
}
