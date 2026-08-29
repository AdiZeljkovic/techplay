<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\Game;
use App\Services\CacheService;
use App\Services\RevalidationService;
use Illuminate\Support\Facades\Cache;
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
        'critic_scores',
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
        Cache::forget(CacheService::gameShowKey($game->slug));
        if ($game->wasChanged('slug')) {
            Cache::forget(CacheService::gameShowKey((string) $game->getOriginal('slug')));
        }

        // Outbound HTTP (revalidation, IndexNow) only for web requests, so bulk
        // imports and enrichment jobs don't flood the endpoints
        if (app()->runningInConsole()) {
            return;
        }

        try {
            app(RevalidationService::class)->revalidateGame($game->slug);
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

        Cache::forget(CacheService::gameShowKey($game->slug));
        Cache::forget("games.articles.v2.{$game->id}");

        if (app()->runningInConsole()) {
            return;
        }

        try {
            app(RevalidationService::class)->revalidateGame($game->slug);
        } catch (\Throwable $e) {
            Log::warning('[GameObserver] Revalidation failed', ['slug' => $game->slug, 'error' => $e->getMessage()]);
        }
    }

    /** Through the one job that knows how — see ArticleObserver for the why. */
    private function pingIndexNow(string $slug): void
    {
        SubmitIndexNow::dispatch(rtrim((string) config('app.site_url'), '/')."/games/{$slug}");
    }
}
