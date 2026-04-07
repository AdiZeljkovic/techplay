<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CrawlIgdbStatus extends Command
{
    protected $signature = 'igdb:status';
    protected $description = 'Show IGDB crawl progress';

    public function handle(): int
    {
        $total      = Game::count();
        $withDetails = Game::whereNotNull('details_crawled_at')->count();
        $withScreens = Game::whereNotNull('screenshots_crawled_at')->count();
        $withVideos  = Game::whereNotNull('movies_crawled_at')->count();
        $withSuggest = Game::whereNotNull('suggested_crawled_at')->count();
        $withDlcs    = Game::whereNotNull('additions_crawled_at')->count();

        $igdbTotal = 230000; // approximate

        $bar = function (int $count, int $of) {
            if ($of <= 0) return str_repeat('░', 10);
            $filled = min(10, (int) round($count / $of * 10));
            return str_repeat('█', $filled) . str_repeat('░', 10 - $filled);
        };

        $pct = fn (int $count, int $of) => $of > 0 ? number_format($count / $of * 100, 1) : '0.0';

        $this->line('');
        $this->line('╔══════════════════════════════════════════════════════════════╗');
        $this->line('║              IGDB Crawl Status                               ║');
        $this->line('╠══════════════════════════════════════════════════════════════╣');
        $this->line(sprintf('║ In database:         %10s / %-10s %s %s%% ║',
            number_format($total), number_format($igdbTotal), $bar($total, $igdbTotal), str_pad($pct($total, $igdbTotal), 5, ' ', STR_PAD_LEFT)));
        $this->line(sprintf('║ With full details:   %10s / %-10s %s %s%% ║',
            number_format($withDetails), number_format($total ?: 1), $bar($withDetails, $total ?: 1), str_pad($pct($withDetails, $total ?: 1), 5, ' ', STR_PAD_LEFT)));
        $this->line(sprintf('║ With screenshots:    %10s / %-10s %s %s%% ║',
            number_format($withScreens), number_format($total ?: 1), $bar($withScreens, $total ?: 1), str_pad($pct($withScreens, $total ?: 1), 5, ' ', STR_PAD_LEFT)));
        $this->line(sprintf('║ With videos:         %10s / %-10s %s %s%% ║',
            number_format($withVideos), number_format($total ?: 1), $bar($withVideos, $total ?: 1), str_pad($pct($withVideos, $total ?: 1), 5, ' ', STR_PAD_LEFT)));
        $this->line(sprintf('║ With similar games:  %10s / %-10s %s %s%% ║',
            number_format($withSuggest), number_format($total ?: 1), $bar($withSuggest, $total ?: 1), str_pad($pct($withSuggest, $total ?: 1), 5, ' ', STR_PAD_LEFT)));
        $this->line(sprintf('║ With DLC:            %10s / %-10s %s %s%% ║',
            number_format($withDlcs), number_format($total ?: 1), $bar($withDlcs, $total ?: 1), str_pad($pct($withDlcs, $total ?: 1), 5, ' ', STR_PAD_LEFT)));
        $this->line('╚══════════════════════════════════════════════════════════════╝');
        $this->line('');

        // Recent activity
        $recent = Game::whereNotNull('details_crawled_at')
            ->orderByDesc('details_crawled_at')
            ->limit(5)
            ->pluck('name')
            ->toArray();

        if (! empty($recent)) {
            $this->line('Recently crawled:');
            foreach ($recent as $name) {
                $this->line("  · {$name}");
            }
            $this->line('');
        }

        return self::SUCCESS;
    }
}
