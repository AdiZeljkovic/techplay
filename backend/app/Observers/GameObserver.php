<?php

namespace App\Observers;

use App\Models\Game;
use App\Services\CacheRevalidationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GameObserver
{
    /**
     * Fields whose change should invalidate the public game page.
     */
    private const REVALIDATION_FIELDS = [
        'name', 'slug', 'released', 'rating', 'cover_url', 'description',
        'screenshots', 'videos', 'genres', 'platforms', 'tags',
        'developers', 'publishers', 'alt_titles', 'age_ratings', 'website',
    ];

    /**
     * Handle the Game "saved" event (create + update).
     *
     * Only runs for web requests (Filament edits, collection auto-create).
     * Bulk CLI imports and queue enrichment jobs are skipped so a re-crawl
     * of thousands of games doesn't flood the revalidation endpoint.
     */
    public function saved(Game $game): void
    {
        if (! $game->slug) {
            return;
        }

        if (! $game->wasRecentlyCreated && ! $game->wasChanged(self::REVALIDATION_FIELDS)) {
            return;
        }

        // Local API cache is always busted, even from CLI/queue jobs
        Cache::forget("games.show.v2.{$game->slug}");
        if ($game->wasChanged('slug')) {
            Cache::forget('games.show.v2.'.$game->getOriginal('slug'));
        }

        // Outbound HTTP (revalidation, IndexNow) only for web requests, so bulk
        // imports and enrichment jobs don't flood the endpoints
        if (app()->runningInConsole()) {
            return;
        }

        try {
            CacheRevalidationService::revalidateGame($game->slug);
        } catch (\Throwable $e) {
            Log::warning('[GameObserver] Revalidation failed', ['slug' => $game->slug, 'error' => $e->getMessage()]);
        }

        // Ping IndexNow only when a game gains a real description — that's the
        // moment the page stops being noindex'd on the frontend and becomes
        // worth submitting to search engines.
        if ($game->wasChanged('description') && filled($game->description)) {
            $this->pingIndexNow($game->slug);
        }
    }

    /**
     * Handle the Game "deleted" event.
     */
    public function deleted(Game $game): void
    {
        if (! $game->slug) {
            return;
        }

        Cache::forget("games.show.v2.{$game->slug}");
        Cache::forget("games.articles.v1.{$game->id}");

        if (app()->runningInConsole()) {
            return;
        }

        try {
            CacheRevalidationService::revalidateGame($game->slug);
        } catch (\Throwable $e) {
            Log::warning('[GameObserver] Revalidation failed', ['slug' => $game->slug, 'error' => $e->getMessage()]);
        }
    }

    private function pingIndexNow(string $slug): void
    {
        $indexNowKey = config('services.indexnow.key');
        if (! $indexNowKey) {
            return;
        }

        $siteUrl = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');

        try {
            Http::timeout(5)->post('https://api.indexnow.org/indexnow', [
                'host' => parse_url($siteUrl, PHP_URL_HOST),
                'key' => $indexNowKey,
                'keyLocation' => "{$siteUrl}/{$indexNowKey}.txt",
                'urlList' => ["{$siteUrl}/games/{$slug}"],
            ]);
        } catch (\Throwable $e) {
            Log::warning('[GameObserver] IndexNow ping failed', ['slug' => $slug, 'error' => $e->getMessage()]);
        }
    }
}
