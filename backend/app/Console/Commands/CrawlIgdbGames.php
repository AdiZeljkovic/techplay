<?php

namespace App\Console\Commands;

use App\Jobs\Igdb\CrawlIgdbBatchJob;
use App\Models\Game;
use App\Services\IgdbService;
use Illuminate\Console\Command;

class CrawlIgdbGames extends Command
{
    protected $signature = 'igdb:crawl
        {--resume : Skip already-crawled offsets (resume interrupted crawl)}
        {--force : Re-crawl all games regardless of crawled_at status}';

    protected $description = 'Dispatch IGDB crawl jobs. One job = 500 games (discover + full details in one API call).';

    public function handle(IgdbService $igdb): int
    {
        $this->info('Fetching total game count from IGDB...');

        $total = $igdb->getTotalCount();

        if ($total === 0) {
            $this->error('Could not fetch total count. Check your IGDB credentials in .env:');
            $this->line('  IGDB_CLIENT_ID=...');
            $this->line('  IGDB_CLIENT_SECRET=...');

            return self::FAILURE;
        }

        $batches = (int) ceil($total / 500);
        $inDb = Game::count();
        $withDetails = Game::whereNotNull('details_crawled_at')->count();

        $this->info("IGDB total games: ~{$total}");
        $this->info("In our DB: {$inDb} discovered, {$withDetails} with full details");
        $this->info("Batches needed: {$batches} (500 games each)");
        $this->newLine();

        $dispatched = 0;
        $skipped = 0;

        for ($offset = 0; $offset < $total; $offset += 500) {
            if ($this->option('resume') && ! $this->option('force')) {
                // Skip if games in this offset range are already crawled
                $batchStart = $offset;
                $batchEnd = $offset + 500;
                $count = Game::whereNotNull('details_crawled_at')
                    ->skip($batchStart)
                    ->take(500)
                    ->count();

                if ($count >= 500) {
                    $skipped++;

                    continue;
                }
            }

            CrawlIgdbBatchJob::dispatch($offset)->onQueue('igdb-crawl');
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} jobs".($skipped > 0 ? " ({$skipped} skipped)" : '').'.');
        $this->newLine();
        $this->info('Start queue worker:');
        $this->line('  php artisan queue:work --queue=igdb-crawl --sleep=1 --tries=5 --timeout=60');
        $this->newLine();
        $this->line('Monitor progress:');
        $this->line('  php artisan igdb:status');

        return self::SUCCESS;
    }
}
