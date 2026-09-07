<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\Game;
use App\Services\CacheService;
use App\Services\NginxPageCache;
use App\Services\RevalidationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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

        /*
         * And the copy nginx holds in front of Next.
         *
         * `/games/*` is proxy-cached for an hour. Redis was cleared above and
         * Cloudflare is purged by the revalidation endpoint, but the layer in
         * between kept answering — so an edit was visible everywhere except on
         * the page. Same as the Redis clear, this runs from the console too:
         * an enrichment job that rewrites a description should not leave the
         * old page standing for an hour either.
         */
        $nginx = app(NginxPageCache::class);
        $nginx->forgetGame($game->slug);

        if ($game->wasChanged('slug')) {
            $nginx->forgetGame((string) $game->getOriginal('slug'));
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

        /*
         * The tombstone, without which the URL answers 404 forever.
         *
         * Only the two purge commands wrote these, so every other way a game
         * left the catalogue — the 08/2026 rebuild, a merge, a delete from the
         * admin — left Google holding an indexed URL that answers "maybe
         * temporary". Fifty-three of the game pages Googlebot crawled in the
         * first week of September were exactly that: slugs it still asks for,
         * that nothing here has a record of ever having removed.
         *
         * An upsert because the purge commands write their own with a more
         * specific reason, and a re-created and re-deleted game must not
         * collide on the unique slug.
         */
        DB::table('game_tombstones')->upsert([[
            'slug' => $game->slug,
            'name' => $game->name ?: $game->slug,
            'reason' => 'deleted',
            'deleted_at' => now(),
        ]], ['slug'], ['name', 'reason', 'deleted_at']);

        Cache::forget(CacheService::gameShowKey($game->slug));
        Cache::forget("games.articles.v2.{$game->id}");

        // A deleted game answers 410 through the tombstone — but only once the
        // cached 200 in front of it is gone. nginx holds 410s for ten minutes
        // and 200s for an hour, so without this the page a crawler is being
        // told to drop keeps serving for the rest of that hour.
        app(NginxPageCache::class)->forgetGame($game->slug);

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
