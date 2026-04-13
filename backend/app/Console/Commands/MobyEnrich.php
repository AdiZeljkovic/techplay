<?php

namespace App\Console\Commands;

use App\Jobs\MobyEnrichmentJob;
use App\Models\Game;
use Illuminate\Console\Command;

class MobyEnrich extends Command
{
    protected $signature = 'moby:enrich
        {--limit=0 : Max number of jobs to dispatch (0 = all pending)}
        {--reset : Reset details_crawled_at to NULL for re-enrichment}
        {--moby-id= : Enrich a single game by moby_id}';

    protected $description = 'Dispatch MobyEnrichmentJob for games that have not yet been enriched';

    public function handle(): int
    {
        if ($this->option('reset')) {
            $affected = Game::whereNotNull('moby_id')->update(['details_crawled_at' => null]);
            $this->info("Reset details_crawled_at for {$affected} games.");
        }

        // Single-game mode
        if ($mobyId = $this->option('moby-id')) {
            $game = Game::where('moby_id', (int) $mobyId)->first();
            if (! $game) {
                $this->error("No game found with moby_id = {$mobyId}");
                return self::FAILURE;
            }

            MobyEnrichmentJob::dispatch($game->id, $game->moby_id);
            $this->info("Dispatched enrichment job for: {$game->name} (moby_id={$mobyId})");
            return self::SUCCESS;
        }

        $limit = (int) $this->option('limit');

        // Enrich only games that already have basic data (from moby:fetch)
        // but are still missing supplementary data (age ratings, full screenshots, covers).
        $query = Game::whereNotNull('moby_id')
            ->whereNotNull('details_crawled_at')   // basic data must exist first
            ->whereNull('screenshots_crawled_at')   // supplementary not yet done
            ->select(['id', 'moby_id', 'name'])
            ->orderBy('id');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No games pending enrichment.');
            return self::SUCCESS;
        }

        $this->info("Dispatching enrichment jobs for {$total} games...");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $dispatched = 0;
        $query->each(function (Game $game) use ($bar, &$dispatched) {
            MobyEnrichmentJob::dispatch($game->id, $game->moby_id);
            $bar->advance();
            $dispatched++;
        });

        $bar->finish();
        $this->newLine();
        $this->info("Dispatched {$dispatched} jobs to the 'moby-enrich' queue.");
        $this->line('Run the worker: php artisan queue:work --queue=moby-enrich --sleep=1 --tries=3');

        return self::SUCCESS;
    }
}
