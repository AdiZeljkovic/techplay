<?php

namespace Tests\Feature;

use App\Services\EpicService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Two parameters, and without either of them Epic answers 200 with nothing.
 *
 * A real account was connected on 27 Aug 2026 and imported zero games. The
 * sync recorded `{"artifacts":0,"games":0,"matched":0}` and marked itself done:
 * no error, no refusal, nothing to investigate from our side. Both halves of
 * the conversation were failing silently.
 *
 * Measured against that same account, same token, same minute:
 *   assets without `label=Live`   → 0 items
 *   assets with it                → 80
 *   catalogue with `id[0]=…`      → 0 items
 *   catalogue with `id=…&id=…`    → all of them
 *
 * After both: 80 artifacts, 78 games, 66 matched to the catalogue.
 */
class EpicLibraryArrivesTest extends TestCase
{
    private function service(): EpicService
    {
        config(['services.epic.enabled' => true]);

        return app(EpicService::class);
    }

    /**
     * The launcher service lists a build channel, and there is no default one.
     */
    #[Test]
    public function the_asset_list_asks_for_the_live_label(): void
    {
        Http::fake(['*launcher-public-service*' => Http::response([
            ['appName' => 'Salt', 'namespace' => 'ns1', 'catalogItemId' => 'id1'],
        ])]);

        $this->service()->ownedArtifacts('token');

        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'label=Live'));
    }

    /**
     * `id` repeats. As an array parameter it becomes `id[0]=`, which the
     * catalogue ignores rather than rejects.
     */
    #[Test]
    public function the_catalogue_is_asked_with_repeated_ids(): void
    {
        Http::fake(['*catalog-public-service*' => Http::response([])]);

        $this->service()->titlesFor('token', [
            ['appName' => 'A', 'namespace' => 'ns1', 'catalogItemId' => 'aaa'],
            ['appName' => 'B', 'namespace' => 'ns1', 'catalogItemId' => 'bbb'],
        ]);

        Http::assertSent(function (Request $r) {
            $url = urldecode($r->url());

            return str_contains($url, 'id=aaa')
                && str_contains($url, 'id=bbb')
                && ! str_contains($url, 'id[0]');
        });
    }

    /**
     * And what comes back is filtered to things somebody plays: Epic returns
     * engine builds, soundtracks and season passes in the same list.
     */
    #[Test]
    public function only_games_survive_the_catalogue(): void
    {
        Http::fake(['*catalog-public-service*' => Http::response([
            'aaa' => ['title' => 'Wolfenstein: The New Order', 'categories' => [['path' => 'games'], ['path' => 'applications']]],
            'bbb' => ['title' => 'Dying Light The Following', 'categories' => [['path' => 'games']], 'mainGameItem' => ['id' => 'aaa']],
            'ccc' => ['title' => 'Selections of Titan Art Book', 'categories' => [['path' => 'addons']]],
            'ddd' => ['title' => 'Unreal Engine', 'categories' => [['path' => 'engines']]],
        ])]);

        $titles = array_column($this->service()->titlesFor('token', [
            ['appName' => 'A', 'namespace' => 'ns1', 'catalogItemId' => 'aaa'],
        ]), 'title');

        $this->assertSame(['Wolfenstein: The New Order'], $titles);
    }

    /**
     * A refusal is not an empty library, and the sync job reads the difference:
     * null stops it with an error, an empty array is an account owning nothing.
     */
    #[Test]
    public function a_refusal_is_not_an_empty_shelf(): void
    {
        Http::fake(['*launcher-public-service*' => Http::response([], 401)]);

        $this->assertNull($this->service()->ownedArtifacts('stale-token'));
    }
}
