<?php

namespace App\Jobs;

use App\Models\Game;
use App\Services\MobyGamesService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MobyEnrichmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(
        private readonly int $gameId,
        private readonly int $mobyId,
    ) {
        $this->onQueue('moby-enrich');
    }

    public function handle(MobyGamesService $moby): void
    {
        $game = Game::find($this->gameId);

        if (! $game || ! $game->moby_id) {
            Log::warning("MobyEnrichmentJob: game {$this->gameId} not found or no moby_id");
            return;
        }

        // Basic game data is already in the DB from `moby:fetch`.
        // This job only fetches the 3 supplementary endpoints that require
        // a platform_id and are not available in the list API response.

        $platforms = $game->platforms ?? [];
        $primaryPid = MobyGamesService::primaryPlatformId($platforms);

        if (! $primaryPid) {
            Log::info("MobyEnrichmentJob: no platform for game {$this->gameId}, skipping");
            // Mark as done so we don't retry forever
            $game->update(['screenshots_crawled_at' => now()]);
            return;
        }

        $detailsData = $game->details_data ?? [];
        $updates     = [];

        // ------------------------------------------------------------------
        // Call 1: GET /v1/games/{id}/platforms/{primary_platform_id}
        // Age ratings (ESRB/PEGI/USK/ACB) + system requirements + attributes
        // ------------------------------------------------------------------
        $platformData = $moby->getPlatformData($this->mobyId, $primaryPid);

        if ($platformData) {
            $detailsData['ratings']    = $platformData['ratings']    ?? [];
            $detailsData['attributes'] = $platformData['attributes'] ?? [];
        }

        // ------------------------------------------------------------------
        // Call 2: GET /v1/games/{id}/platforms/{primary_platform_id}/screenshots
        // ------------------------------------------------------------------
        $screenshotsData = $moby->getScreenshots($this->mobyId, $primaryPid);

        if ($screenshotsData) {
            $updates['screenshots_data']       = $screenshotsData;
            $updates['screenshots_crawled_at'] = now();
        } else {
            // Mark as attempted so we don't retry indefinitely
            $updates['screenshots_crawled_at'] = now();
        }

        // ------------------------------------------------------------------
        // Call 3: GET /v1/games/{id}/platforms/{primary_platform_id}/covers
        // ------------------------------------------------------------------
        $coversData = $moby->getCovers($this->mobyId, $primaryPid);

        if ($coversData) {
            $detailsData['covers'] = $coversData['cover_groups'] ?? [];
        }

        $updates['details_data'] = $detailsData;

        $game->update($updates);
    }
}
