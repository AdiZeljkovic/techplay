<?php

namespace App\Console\Commands;

use App\Jobs\Rawg\DiscoverGamesJob;
use App\Jobs\Rawg\FetchGameAdditionsJob;
use App\Jobs\Rawg\FetchGameDetailsJob;
use App\Jobs\Rawg\FetchGameMoviesJob;
use App\Jobs\Rawg\FetchGameScreenshotsJob;
use App\Jobs\Rawg\FetchGameSeriesJob;
use App\Jobs\Rawg\FetchGameSuggestedJob;
use App\Models\Game;
use App\Services\ApiKeyManager;
use Illuminate\Console\Command;

class CrawlRawgGames extends Command
{
    protected $signature = 'rawg:crawl
        {--step=all : discover|details|screenshots|movies|series|suggested|additions|all}
        {--from-page=1 : Start discover from this page number}';

    protected $description = 'Dispatch RAWG crawl jobs into the queue. Idempotent — skips already-crawled data.';

    // RAWG has ~898,289 games at 24/page
    const TOTAL_RAWG_PAGES = 37429;

    public function handle(ApiKeyManager $keyManager): int
    {
        $step = $this->option('step');
        $stats = $keyManager->getStats();

        $this->info("API Keys: {$stats['active_keys']} active key(s), {$stats['total_remaining']} calls remaining");
        $this->newLine();

        if ($stats['total_remaining'] == 0) {
            $this->error('No API calls remaining! Add a new key first:');
            $this->line('  php artisan rawg:keys add <your-api-key> --label="acc@gmail.com"');
            return self::FAILURE;
        }

        if (in_array($step, ['discover', 'all'])) {
            $this->dispatchDiscover();
        }

        if (in_array($step, ['details', 'all'])) {
            $this->dispatchDetails();
        }

        if (in_array($step, ['screenshots', 'all'])) {
            $this->dispatchScreenshots();
        }

        if (in_array($step, ['movies', 'all'])) {
            $this->dispatchMovies();
        }

        if (in_array($step, ['series', 'all'])) {
            $this->dispatchSeries();
        }

        if (in_array($step, ['suggested', 'all'])) {
            $this->dispatchSuggested();
        }

        if (in_array($step, ['additions', 'all'])) {
            $this->dispatchAdditions();
        }

        $this->newLine();
        $this->info('All jobs dispatched! Start queue workers:');
        $this->line('  php artisan queue:work --queue=rawg-discover,rawg-details,rawg-screenshots,rawg-movies,rawg-series,rawg-suggested,rawg-additions --sleep=1 --tries=10 --timeout=30');
        $this->newLine();
        $this->line('Monitor progress:');
        $this->line('  php artisan rawg:status');

        return self::SUCCESS;
    }

    // -------------------------------------------------------------------------

    private function dispatchDiscover(): void
    {
        $discovered = Game::count();
        $fromPage   = (int) $this->option('from-page');

        // Resume: start after last known page
        $startPage = max($fromPage, (int) ceil($discovered / 24) + 1);
        $endPage   = self::TOTAL_RAWG_PAGES;

        if ($startPage > $endPage) {
            $this->line("  [discover] All ~{$discovered} pages already discovered. Skipping.");
            return;
        }

        $count = $endPage - $startPage + 1;
        $this->line("  [discover] Dispatching {$count} page jobs (page {$startPage} → {$endPage})...");

        for ($page = $startPage; $page <= $endPage; $page++) {
            DiscoverGamesJob::dispatch($page)->onQueue('rawg-discover');
        }

        $this->line("  [discover] Done — {$count} jobs in queue.");
    }

    private function dispatchDetails(): void
    {
        $pending = Game::whereNull('details_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [details] All games already have details. Skipping.');
            return;
        }

        $this->line("  [details] Dispatching {$pending} jobs...");

        Game::whereNull('details_crawled_at')
            ->orderByDesc('rating')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameDetailsJob::dispatch($game->slug)->onQueue('rawg-details');
                }
            });

        $this->line("  [details] Done — {$pending} jobs in queue.");
    }

    private function dispatchScreenshots(): void
    {
        $pending = Game::whereNotNull('details_crawled_at')->whereNull('screenshots_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [screenshots] Nothing pending. Skipping.');
            return;
        }

        $this->line("  [screenshots] Dispatching {$pending} jobs...");

        Game::whereNotNull('details_crawled_at')
            ->whereNull('screenshots_crawled_at')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameScreenshotsJob::dispatch($game->slug)->onQueue('rawg-screenshots');
                }
            });

        $this->line("  [screenshots] Done — {$pending} jobs in queue.");
    }

    private function dispatchMovies(): void
    {
        $pending = Game::whereNotNull('details_crawled_at')->whereNull('movies_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [movies] Nothing pending. Skipping.');
            return;
        }

        $this->line("  [movies] Dispatching {$pending} jobs...");

        Game::whereNotNull('details_crawled_at')
            ->whereNull('movies_crawled_at')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameMoviesJob::dispatch($game->slug)->onQueue('rawg-movies');
                }
            });

        $this->line("  [movies] Done — {$pending} jobs in queue.");
    }

    private function dispatchSeries(): void
    {
        $pending = Game::whereNotNull('details_crawled_at')->whereNull('series_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [series] Nothing pending. Skipping.');
            return;
        }

        $this->line("  [series] Dispatching {$pending} jobs...");

        Game::whereNotNull('details_crawled_at')
            ->whereNull('series_crawled_at')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameSeriesJob::dispatch($game->slug)->onQueue('rawg-series');
                }
            });

        $this->line("  [series] Done — {$pending} jobs in queue.");
    }

    private function dispatchSuggested(): void
    {
        $pending = Game::whereNotNull('details_crawled_at')->whereNull('suggested_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [suggested] Nothing pending. Skipping.');
            return;
        }

        $this->line("  [suggested] Dispatching {$pending} jobs...");

        Game::whereNotNull('details_crawled_at')
            ->whereNull('suggested_crawled_at')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameSuggestedJob::dispatch($game->slug)->onQueue('rawg-suggested');
                }
            });

        $this->line("  [suggested] Done — {$pending} jobs in queue.");
    }

    private function dispatchAdditions(): void
    {
        $pending = Game::whereNotNull('details_crawled_at')->whereNull('additions_crawled_at')->count();

        if ($pending === 0) {
            $this->line('  [additions] Nothing pending. Skipping.');
            return;
        }

        $this->line("  [additions] Dispatching {$pending} jobs...");

        Game::whereNotNull('details_crawled_at')
            ->whereNull('additions_crawled_at')
            ->chunk(500, function ($games) {
                foreach ($games as $game) {
                    FetchGameAdditionsJob::dispatch($game->slug)->onQueue('rawg-additions');
                }
            });

        $this->line("  [additions] Done — {$pending} jobs in queue.");
    }
}
