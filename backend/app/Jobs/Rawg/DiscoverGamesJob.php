<?php

namespace App\Jobs\Rawg;

use App\Services\RawgService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DiscoverGamesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 10;
    public int   $timeout = 30;
    public array $backoff  = [60, 120, 300, 600, 600, 600, 600, 600, 600, 600];

    public function __construct(public readonly int $page) {}

    public function handle(RawgService $rawg): void
    {
        $rawg->discoverPage($this->page);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("DiscoverGamesJob failed for page {$this->page}: " . $e->getMessage());
    }
}
