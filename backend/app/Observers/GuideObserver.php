<?php

namespace App\Observers;

use App\Events\GuidePublished;
use App\Models\Guide;
use App\Services\ContentGameLinker;
use App\Services\RevalidationService;
use App\Services\SanitizationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GuideObserver
{
    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * Sanitize the HTML body before it hits the database, so the frontend
     * can safely render it with dangerouslySetInnerHTML.
     */
    public function saving(Guide $guide): void
    {
        if ($guide->isDirty('content') && is_string($guide->content)) {
            $guide->content = app(SanitizationService::class)
                ->sanitizeStaffContent($guide->content);
        }

        // Same spine as articles: a guide about a game belongs to it.
        if ($guide->game_id === null && filled($guide->title)) {
            $guide->game_id = app(ContentGameLinker::class)->match(
                null,
                $guide->title,
                $guide->published_at?->year ?? now()->year,
            );
        }
    }

    public function created(Guide $guide): void
    {
        if ($guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
            $this->revalidationService->revalidateArticle($guide->slug, 'guides');
            $this->pingSearchEngines($guide->slug);
        }

        $this->invalidateCache($guide);
    }

    public function updated(Guide $guide): void
    {
        if ($guide->status === 'published') {
            $this->revalidationService->revalidateArticle($guide->slug, 'guides');

            if ($guide->isDirty('status')) {
                broadcast(new GuidePublished($guide))->toOthers();
                $this->pingSearchEngines($guide->slug);
            }
        }

        $this->invalidateCache($guide);
    }

    protected function pingSearchEngines(string $slug): void
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');
        $articleUrl = "{$siteUrl}/guides/{$slug}";
        $indexNowKey = config('services.indexnow.key');

        if ($indexNowKey) {
            try {
                Http::timeout(5)->post('https://api.indexnow.org/indexnow', [
                    'host' => parse_url($siteUrl, PHP_URL_HOST),
                    'key' => $indexNowKey,
                    'keyLocation' => "{$siteUrl}/{$indexNowKey}.txt",
                    'urlList' => [$articleUrl],
                ]);
            } catch (\Exception $e) {
                Log::warning('IndexNow ping failed for guide', ['error' => $e->getMessage()]);
            }
        }
    }

    public function deleted(Guide $guide): void
    {
        /*
         * `updated()` has always told the frontend; `deleted()` never did. So a
         * deleted guide kept its page on techplay.gg, served out of Next's data
         * cache, long after the row and the Redis entry were gone.
         */
        $this->revalidationService->revalidateArticle($guide->slug, 'guides');

        $this->invalidateCache($guide);
    }

    /**
     * Invalidate guide cache when guide changes
     */
    protected function invalidateCache(Guide $guide): void
    {
        /*
         * v3, which is what `GuideController::show` writes.
         *
         * The key was bumped in the controller and this line was not, so every
         * guide edit and every guide deletion has been clearing a key nobody
         * writes. A deleted guide answered 200 from cache; an edited one served
         * the old text until the TTL ran out.
         */
        Cache::forget("guide.show.v3.{$guide->slug}");

        // The previous key, for anything still sitting in Redis under it.
        Cache::forget("guide.show.v2.{$guide->slug}");

        // Clear guide listing cache (first 5 pages, all difficulties, no search)
        for ($page = 1; $page <= 5; $page++) {
            foreach (['all', 'beginner', 'intermediate', 'advanced'] as $diff) {
                $cacheKey = "guides.index.v2.page_{$page}.diff_{$diff}.search_".md5('');
                Cache::forget($cacheKey);
            }
        }
    }
}
