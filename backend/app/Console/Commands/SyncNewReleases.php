<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\GameExternalId;
use App\Services\RawgService;
use Illuminate\Console\Command;

/**
 * The MobyGames bulk import is finished and no longer runs, so without this
 * the only way a new release enters the local games table is a user adding
 * it to their collection. This keeps the database current automatically.
 */
class SyncNewReleases extends Command
{
    protected $signature = 'games:sync-new-releases {--days-back=14} {--days-ahead=60}';

    protected $description = 'Import newly released and upcoming games from RAWG into the local games table';

    public function handle(RawgService $rawg): int
    {
        $from = now()->subDays((int) $this->option('days-back'))->toDateString();
        $to = now()->addDays((int) $this->option('days-ahead'))->toDateString();

        $data = $rawg->getReleases($from, $to, '-added', 5);

        if (! $data || empty($data['results'])) {
            $this->warn('No releases returned from RAWG.');

            return self::FAILURE;
        }

        $created = 0;

        foreach ($data['results'] as $r) {
            if (empty($r['slug']) || empty($r['name'])) {
                continue;
            }

            $game = Game::firstOrCreate(['slug' => $r['slug']], [
                'name' => $r['name'],
                'released' => $r['released'] ?? null,
                'rating' => $r['rating'] ?? 0,
                'background_image' => $r['background_image'] ?? null,
                'platforms' => $r['platforms'] ?? [],
                'short_screenshots' => $r['short_screenshots'] ?? [],
                'genre_names' => array_map(fn ($g) => $g['name'], $r['genres'] ?? []),
                'platform_names' => array_values(array_unique(array_map(
                    fn ($p) => $p['platform']['name'] ?? '',
                    $r['platforms'] ?? []
                ))),
                'details_crawled_at' => now(),
            ]);

            if ($game->wasRecentlyCreated) {
                $created++;

                if (! empty($r['id'])) {
                    GameExternalId::firstOrCreate(
                        ['provider' => 'rawg', 'external_id' => (string) $r['id']],
                        ['game_id' => $game->id]
                    );
                }
            }
        }

        $this->info("Synced {$from} → {$to}: ".count($data['results'])." releases seen, {$created} new games created.");

        return self::SUCCESS;
    }
}
