<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\ApiKeyManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CrawlRawgStatus extends Command
{
    protected $signature   = 'rawg:status';
    protected $description = 'Show current RAWG crawl progress.';

    const TOTAL_RAWG_GAMES = 898289;

    public function handle(ApiKeyManager $keyManager): int
    {
        $total       = Game::count();
        $details     = Game::whereNotNull('details_crawled_at')->count();
        $screenshots = Game::whereNotNull('screenshots_crawled_at')->count();
        $movies      = Game::whereNotNull('movies_crawled_at')->count();
        $series      = Game::whereNotNull('series_crawled_at')->count();
        $suggested   = Game::whereNotNull('suggested_crawled_at')->count();
        $additions   = Game::whereNotNull('additions_crawled_at')->count();

        $rawgTotal = self::TOTAL_RAWG_GAMES;

        // Queue pending jobs count (database driver)
        $queuePending = 0;
        try {
            $queuePending = DB::table('jobs')->count();
        } catch (\Exception) {
            // queue table may not exist locally
        }

        $keyStats = $keyManager->getStats();

        $this->newLine();
        $this->line('<fg=cyan>╔══════════════════════════════════════════════════════════╗</>');
        $this->line('<fg=cyan>║              RAWG Crawl Status                           ║</>');
        $this->line('<fg=cyan>╠══════════════════════════════════════════════════════════╣</>');

        $this->statusLine('Discovered (preview)', $total,       $rawgTotal);
        $this->statusLine('With details',         $details,     $total ?: 1);
        $this->statusLine('With screenshots',     $screenshots, $details ?: 1);
        $this->statusLine('With movies',          $movies,      $details ?: 1);
        $this->statusLine('With series',          $series,      $details ?: 1);
        $this->statusLine('With suggested',       $suggested,   $details ?: 1);
        $this->statusLine('With additions',       $additions,   $details ?: 1);

        $this->line('<fg=cyan>╠══════════════════════════════════════════════════════════╣</>');
        $this->line(sprintf(
            '<fg=cyan>║</> Queue jobs pending:   <fg=yellow>%-35s</> <fg=cyan>║</>',
            number_format($queuePending)
        ));
        $this->line(sprintf(
            '<fg=cyan>║</> API keys active:       <fg=yellow>%-35s</> <fg=cyan>║</>',
            "{$keyStats['active_keys']} / {$keyStats['total_keys']}"
        ));
        $this->line(sprintf(
            '<fg=cyan>║</> API calls remaining:   <fg=yellow>%-35s</> <fg=cyan>║</>',
            number_format($keyStats['total_remaining'])
        ));
        $this->line('<fg=cyan>╚══════════════════════════════════════════════════════════╝</>');
        $this->newLine();

        if ($keyStats['total_remaining'] == 0) {
            $this->warn('All keys exhausted! Workers are paused. Add a new key to resume:');
            $this->line('  php artisan rawg:keys add <your-key> --label="acc@gmail.com"');
        }

        return self::SUCCESS;
    }

    private function statusLine(string $label, int $count, int $outOf): void
    {
        $pct = $outOf > 0 ? round(($count / $outOf) * 100, 1) : 0;
        $bar = $this->progressBar($pct);

        $this->line(sprintf(
            '<fg=cyan>║</> %-20s <fg=green>%10s</> / %-10s %s <fg=cyan>║</>',
            $label . ':',
            number_format($count),
            number_format($outOf),
            $bar
        ));
    }

    private function progressBar(float $pct): string
    {
        $filled = (int) round($pct / 10);
        $empty  = 10 - $filled;
        $bar    = str_repeat('█', $filled) . str_repeat('░', $empty);

        $color = match (true) {
            $pct >= 80 => 'green',
            $pct >= 40 => 'yellow',
            default    => 'red',
        };

        return "<fg={$color}>{$bar}</> " . number_format($pct, 1) . '%';
    }
}
