<?php

namespace App\Observers;

use App\Events\GuidePublished;
use App\Jobs\SubmitIndexNow;
use App\Models\Guide;
use App\Services\CacheService;
use App\Services\ContentGameLinker;
use App\Services\RevalidationService;
use App\Services\SanitizationService;
use Illuminate\Support\Facades\Cache;

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
        /*
         * A guide leaving `published` has to reach the frontend as loudly as
         * one arriving. This call sat inside the published branch, so a guide
         * pulled back for a rewrite kept its page on techplay.gg: the API
         * answered 404 while Next served the copy it already held.
         */
        $this->revalidationService->revalidateArticle($guide->slug, 'guides');

        if ($guide->status === 'published' && $guide->isDirty('status')) {
            broadcast(new GuidePublished($guide))->toOthers();
            $this->pingSearchEngines($guide->slug);
        }

        $this->invalidateCache($guide);
    }

    /** Through the one job that knows how — see ArticleObserver for the why. */
    protected function pingSearchEngines(string $slug): void
    {
        SubmitIndexNow::dispatch(rtrim((string) config('app.site_url'), '/')."/guides/{$slug}");
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
         * Both spellings come from CacheService, because it is the only place
         * that knows how a guide key is built. Spelling them here by hand is
         * what left the listing loop a version behind: the controller wrote
         * `guides.index.v3.…` and this cleared v2, so an edited guide kept its
         * old card until the TTL lapsed. The loop could not have covered it
         * anyway — it walked five pages of four difficulties with an empty
         * search, and a listing key also carries the search term. The register
         * the controller writes to reaches every variant that exists.
         */
        Cache::forget(CacheService::articleShowKey('guide', $guide->slug));
        CacheService::forgetListings('guides');
    }
}
