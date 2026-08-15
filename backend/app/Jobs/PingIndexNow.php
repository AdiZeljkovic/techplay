<?php

namespace App\Jobs;

use App\Services\IndexNowService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Ping IndexNow asynchronously to avoid blocking HTTP requests.
 */
class PingIndexNow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Bing and Yandex; a missed ping is an unindexed article. */
    public int $tries = 3;

    /** Seconds between attempts. */
    public array $backoff = [30, 120, 600];

    /** A queue job that dies quietly is a job nobody knows stopped. */
    public function failed(Throwable $e): void
    {
        Log::error('PingIndexNow failed', ['error' => $e->getMessage()]);
    }

    public function __construct(
        protected string $url
    ) {}

    public function handle(): void
    {
        IndexNowService::ping($this->url);
    }
}
