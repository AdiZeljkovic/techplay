<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Studio;
use App\Services\CacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The studios endpoints.
 *
 * Two things are worth pinning. The listing shows the studios worth landing on
 * rather than all 56,911, because two thirds of them have one game and nothing
 * written about them — but the detail page still answers for those, since every
 * game page links to its studio and a link that 404s is worse than a thin page.
 * And developed and published stay apart all the way to the response.
 */
class StudioApiTest extends TestCase
{
    use RefreshDatabase;

    private function studio(string $name, array $attributes = []): Studio
    {
        return Studio::create(array_merge([
            'name' => $name,
            'slug' => Str::slug($name),
            'games_count' => 1,
            'indexable' => true,
        ], $attributes));
    }

    private function game(string $name, ?string $released = '2019-01-01'): Game
    {
        return Game::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'released' => $released,
        ]);
    }

    public function test_the_listing_returns_studios_worth_landing_on(): void
    {
        $this->studio('Big Studio', ['games_count' => 30]);
        $this->studio('Small Studio', ['games_count' => 1, 'indexable' => false]);

        $response = $this->getJson('/api/v1/studios');

        $response->assertOk()->assertJsonPath('success', true);

        $names = collect($response->json('data'))->pluck('name');

        $this->assertTrue($names->contains('Big Studio'));
        $this->assertFalse($names->contains('Small Studio'), 'a thin studio is not on page one of an index');
    }

    /** The long tail is reachable for anyone who asks for it. */
    public function test_all_includes_the_thin_ones(): void
    {
        $this->studio('Small Studio', ['games_count' => 1, 'indexable' => false]);

        $names = collect($this->getJson('/api/v1/studios?all=1')->json('data'))->pluck('name');

        $this->assertTrue($names->contains('Small Studio'));
    }

    public function test_the_listing_can_be_searched_and_sorted(): void
    {
        $this->studio('Arkane Studios', ['games_count' => 12]);
        $this->studio('Zebra Games', ['games_count' => 40]);

        $found = collect($this->getJson('/api/v1/studios?search=arkane')->json('data'))->pluck('name');
        $this->assertSame(['Arkane Studios'], $found->all());

        $byName = collect($this->getJson('/api/v1/studios?sort=name')->json('data'))->pluck('name');
        $this->assertSame(['Arkane Studios', 'Zebra Games'], $byName->all());

        $byGames = collect($this->getJson('/api/v1/studios?sort=games')->json('data'))->pluck('name');
        $this->assertSame(['Zebra Games', 'Arkane Studios'], $byGames->all());
    }

    /** The role is on the pivot precisely so these two never merge. */
    public function test_the_detail_keeps_developed_and_published_apart(): void
    {
        $studio = $this->studio('Bethesda', ['games_count' => 2]);
        $made = $this->game('Their Own Game');
        $putOut = $this->game('Somebody Elses Game');

        $studio->games()->attach($made->id, ['role' => 'developer']);
        $studio->games()->attach($putOut->id, ['role' => 'publisher']);

        $response = $this->getJson('/api/v1/studios/bethesda');

        $response->assertOk()
            ->assertJsonPath('data.name', 'Bethesda')
            ->assertJsonPath('data.developed.0.name', 'Their Own Game')
            ->assertJsonPath('data.published.0.name', 'Somebody Elses Game');

        $this->assertCount(1, $response->json('data.developed'));
        $this->assertCount(1, $response->json('data.published'));
    }

    /** Thin or not, the page answers — a game page links straight to it. */
    public function test_a_thin_studio_still_has_a_page(): void
    {
        $this->studio('Small Studio', ['games_count' => 1, 'indexable' => false]);

        $this->getJson('/api/v1/studios/small-studio')
            ->assertOk()
            ->assertJsonPath('data.indexable', false);
    }

    /**
     * IGDB stores ISO 3166-1 numeric and nothing else, so the mapping lives in
     * one place on this side and the response carries a printable name.
     */
    public function test_a_country_comes_back_named_and_filters_either_way(): void
    {
        $this->studio('Japanese Studio', ['country' => 392]);
        $this->studio('French Studio', ['country' => 250]);

        $this->getJson('/api/v1/studios/japanese-studio')
            ->assertOk()
            ->assertJsonPath('data.country.alpha2', 'JP')
            ->assertJsonPath('data.country.name', 'Japan');

        $byLetters = collect($this->getJson('/api/v1/studios?country=JP')->json('data'))->pluck('name');
        $byNumber = collect($this->getJson('/api/v1/studios?country=392')->json('data'))->pluck('name');

        $this->assertSame(['Japanese Studio'], $byLetters->all());
        $this->assertSame(['Japanese Studio'], $byNumber->all());
    }

    /** A code we have no name for is left off, not guessed at. */
    public function test_an_unmapped_country_comes_back_null(): void
    {
        $this->studio('Somewhere Studio', ['country' => 999]);

        $this->getJson('/api/v1/studios/somewhere-studio')
            ->assertOk()
            ->assertJsonPath('data.country', null);
    }

    /**
     * A studio's releases, year by year — over everything it shipped, not over
     * the shelf, which stops at 48. And a game it both made and published is
     * one release: counting the credit twice would draw a studio twice its
     * real size.
     */
    public function test_the_years_count_releases_not_credits(): void
    {
        $studio = $this->studio('Supergiant Games', ['games_count' => 2]);
        $hades = $this->game('Hades', '2018-12-06');
        $pyre = $this->game('Pyre', '2017-07-25');

        foreach ([$hades, $pyre] as $game) {
            $studio->games()->attach($game->id, ['role' => 'developer']);
            $studio->games()->attach($game->id, ['role' => 'publisher']);
        }

        $years = $this->getJson('/api/v1/studios/supergiant-games')->assertOk()->json('data.years');

        $this->assertSame(['2017' => 1, '2018' => 1], $years, 'made and published is one release, not two');
    }

    /**
     * The cached payload is keyed by a version, and the version lives in one
     * place.
     *
     * `years` was added while the key stayed `v1`, so every studio anyone had
     * already visited went on serving a copy without it — the section simply
     * did not appear, on exactly the pages that get looked at most.
     */
    public function test_the_cached_payload_is_keyed_by_its_version(): void
    {
        $this->studio('Cached Studio');

        $this->getJson('/api/v1/studios/cached-studio')->assertOk();

        $this->assertNotNull(
            Cache::get(CacheService::studioShowKey('cached-studio')),
            'the response has to land under the versioned key, not a hand-written one',
        );
    }

    /** The shape of a field must not depend on whether there is anything in it. */
    public function test_years_stays_an_object_when_empty(): void
    {
        $this->studio('Quiet Studio');

        $body = $this->getJson('/api/v1/studios/quiet-studio')->assertOk()->getContent();

        $this->assertStringContainsString('"years":{}', $body);
    }

    public function test_an_unknown_studio_is_a_404(): void
    {
        $this->getJson('/api/v1/studios/nobody-here')->assertNotFound();
    }

    /**
     * The sitemap lists the studios worth crawling, and the index names the
     * file only when there is one.
     *
     * The index and the generator apply the same test on purpose: when they
     * disagreed before, the index named files nothing wrote and crawlers kept
     * fetching them for months.
     */
    public function test_the_sitemap_carries_only_indexable_studios(): void
    {
        $this->studio('Big Studio', ['games_count' => 30]);
        $this->studio('Small Studio', ['games_count' => 1, 'indexable' => false]);

        $sitemap = $this->get('/sitemap-studios.xml');

        $sitemap->assertOk();
        $sitemap->assertSee('/studios/big-studio', false);
        $sitemap->assertDontSee('/studios/small-studio', false);

        $this->get('/sitemap.xml')->assertOk()->assertSee('sitemap-studios.xml', false);
    }

    /** No studios yet is no entry — not an empty file crawlers fetch forever. */
    public function test_the_index_leaves_studios_out_when_there_are_none(): void
    {
        $this->get('/sitemap.xml')->assertOk()->assertDontSee('sitemap-studios.xml', false);
    }

    /** A game carries its studios as somewhere to go, beside the plain names. */
    public function test_a_game_lists_its_studios(): void
    {
        $studio = $this->studio('Arkane Studios');
        $game = $this->game('Dishonored');
        $game->update(['developers' => ['Arkane Studios']]);
        $studio->games()->attach($game->id, ['role' => 'developer']);

        $response = $this->getJson('/api/v1/games/dishonored');

        $response->assertOk()
            ->assertJsonPath('studios.0.slug', 'arkane-studios')
            ->assertJsonPath('studios.0.role', 'developer');

        /* The names stay too — they cover games we never matched to IGDB. */
        $this->assertSame(['Arkane Studios'], $response->json('developers'));
    }
}
