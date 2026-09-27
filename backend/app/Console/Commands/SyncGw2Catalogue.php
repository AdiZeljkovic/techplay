<?php

namespace App\Console\Commands;

use App\Services\Gw2\CatalogueSync;
use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2RateLimited;
use App\Services\Gw2\Gw2Unavailable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Pull the Guild Wars 2 catalogue into our own tables.
 *
 * Run nightly. It costs one request to find out whether anything changed —
 * /v2/build answers with a single integer — and on most nights that is the
 * whole run. When the game does move, the endpoints behind it are re-read at
 * about 492 requests for the full set.
 *
 * Nightly rather than on demand because the budget is shared: the limit is
 * counted per IP and every request TechPlay makes leaves from one server, so
 * four hundred requests spent on items is four hundred a waiting player did
 * not get. At 3am nobody is waiting.
 */
class SyncGw2Catalogue extends Command
{
    protected $signature = 'gw2:catalogue
        {--only= : One endpoint, for repairing a single table}
        {--force : Re-read even where the stored build already matches}';

    protected $description = 'Mirror the Guild Wars 2 game catalogue into TechPlay';

    public function handle(Gw2Client $api, CatalogueSync $catalogue): int
    {
        try {
            $build = $api->buildId();
        } catch (Gw2Unavailable $e) {
            $this->error('ArenaNet could not be reached: '.$e->getMessage());

            // Not a failure worth alerting on. The catalogue we have is still
            // correct for the build it was read at; tomorrow will do.
            return self::SUCCESS;
        }

        if (! $build) {
            $this->error('/v2/build gave no build id.');

            return self::FAILURE;
        }

        $this->line("Game build <info>{$build}</info>");

        $wanted = $this->option('only')
            ? [$this->option('only')]
            : ($this->option('force') ? $catalogue->endpoints() : $catalogue->stale($build));

        if ($wanted === []) {
            $this->line('Everything is already at this build. Nothing to read.');

            return self::SUCCESS;
        }

        $this->line('To read: '.implode(', ', $wanted));
        $this->newLine();

        $failed = [];

        foreach ($wanted as $endpoint) {
            // One endpoint being refused is not a reason to skip the rest —
            // and the ones already stored stay at their own build, so the next
            // run picks up exactly what is missing.
            try {
                $this->one($catalogue, $endpoint, $build);
            } catch (Gw2RateLimited $e) {
                $this->warn("  {$endpoint}: budget spent — will resume on the next run");
                $this->note($endpoint, $e->getMessage());
                $failed[] = $endpoint;

                // Nothing else will get through this minute either.
                break;
            } catch (Gw2Unavailable $e) {
                $this->warn("  {$endpoint}: {$e->getMessage()}");
                $this->note($endpoint, $e->getMessage());
                $failed[] = $endpoint;
            }
        }

        $this->newLine();
        $this->table(
            ['Endpoint', 'Rows', 'Build', 'Read'],
            DB::table('gw2_catalog_meta')->orderBy('endpoint')->get()
                ->map(fn ($r) => [$r->endpoint, number_format($r->row_count), $r->build_id, $r->refreshed_at])
                ->all()
        );

        return $failed === [] ? self::SUCCESS : self::FAILURE;
    }

    private function one(CatalogueSync $catalogue, string $endpoint, int $build): void
    {
        $started = microtime(true);
        $bar = null;

        $rows = $catalogue->refresh($endpoint, $build, function (int $done, int $total) use (&$bar, $endpoint) {
            if (! $bar) {
                $bar = $this->output->createProgressBar($total);
                $bar->setFormat("  {$endpoint}: %current%/%max% %bar% %percent:3s%%");
                $bar->start();
            }

            $bar->setProgress(min($done, $total));
        });

        $bar?->finish();
        $this->newLine();

        $this->line(sprintf('  <info>%s</info>: %s rows in %.1fs', $endpoint, number_format($rows), microtime(true) - $started));
    }

    private function note(string $endpoint, string $error): void
    {
        DB::table('gw2_catalog_meta')->updateOrInsert(
            ['endpoint' => $endpoint],
            ['attempted_at' => now(), 'last_error' => mb_substr($error, 0, 500)]
        );
    }
}
