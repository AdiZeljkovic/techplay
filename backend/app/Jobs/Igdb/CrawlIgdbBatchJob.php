<?php

namespace App\Jobs\Igdb;

use App\Services\IgdbService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CrawlIgdbBatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 5;
    public int   $timeout = 60;
    public array $backoff  = [30, 60, 120, 300, 300];

    public function __construct(public readonly int $offset) {}

    public function handle(IgdbService $igdb): void
    {
        // IGDB rate limit: 4 req/sec — sleep between jobs when using a single worker
        usleep(250000); // 250ms = 4 req/sec

        $count = $igdb->crawlBatch($this->offset);

        Log::info("IGDB batch crawled: offset={$this->offset}, games={$count}");
    }

    public function failed(\Throwable $e): void
    {
        Log::error("CrawlIgdbBatchJob failed at offset {$this->offset}: " . $e->getMessage());
    }
}
