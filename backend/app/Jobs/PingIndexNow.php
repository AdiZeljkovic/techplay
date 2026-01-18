<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\IndexNowService;

/**
 * Ping IndexNow asynchronously to avoid blocking HTTP requests.
 */
class PingIndexNow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected string $url
    ) {
    }

    public function handle(): void
    {
        IndexNowService::ping($this->url);
    }
}
