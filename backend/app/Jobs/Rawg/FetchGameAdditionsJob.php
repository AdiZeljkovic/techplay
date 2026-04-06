<?php

namespace App\Jobs\Rawg;

use App\Services\RawgService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchGameAdditionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 10;
    public int   $timeout = 30;
    public array $backoff  = [60, 120, 300, 600, 600, 600, 600, 600, 600, 600];

    public function __construct(public readonly string $slug) {}

    public function handle(RawgService $rawg): void
    {
        $rawg->getGameAdditions($this->slug);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("FetchGameAdditionsJob failed for {$this->slug}: " . $e->getMessage());
    }
}
