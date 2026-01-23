<?php

namespace App\Observers;

use App\Events\ArticlePublished;
use App\Models\Article;
use App\Models\Redirect;
use App\Services\IndexNowService;
use App\Services\CacheRevalidationService;
use Illuminate\Support\Facades\Cache;

class ArticleObserver
{
    /**
     * Handle the Article "updating" event.
     * Auto-create 301 redirect when slug changes
     */
    public function updating(Article $article): void
    {
        if ($article->isDirty('slug')) {
            $oldSlug = $article->getOriginal('slug');
            $newSlug = $article->slug;

            if ($oldSlug && $oldSlug !== $newSlug) {
                $existing = Redirect::where('source_url', "/news/{$oldSlug}")->first();

                if (!$existing) {
                    Redirect::create([
                        'source_url' => "/news/{$oldSlug}",
                        'target_url' => "/news/{$newSlug}",
                        'status_code' => 301,
                        'is_active' => true,
                        'note' => 'Auto: slug change',
                    ]);
                } else {
                    $existing->update(['target_url' => "/news/{$newSlug}"]);
                }
            }
        }
    }

    /**
     * Handle the Article "created" event.
     */
    public function created(Article $article): void
    {
        $this->invalidateCache($article);

        if ($article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();

            // PERFORMANCE: Dispatch to queue instead of sync HTTP call
            $url = config('app.frontend_url') . "/news/{$article->slug}";
            \App\Jobs\PingIndexNow::dispatch($url);
        }
    }

    /**
     * Handle the Article "updated" event.
     */
    public function updated(Article $article): void
    {
        $this->invalidateCache($article);

        if ($article->isDirty('status') && $article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();

            // PERFORMANCE: Dispatch to queue instead of sync HTTP call
            $url = config('app.frontend_url') . "/news/{$article->slug}";
            \App\Jobs\PingIndexNow::dispatch($url);
        }
    }

    /**
     * Handle the Article "deleted" event.
     */
    public function deleted(Article $article): void
    {
        $this->invalidateCache($article);
    }

    /**
     * Invalidate all relevant caches for this article.
     */
    protected function invalidateCache(Article $article): void
    {
        $slug = $article->slug;
        $categoryType = $article->category?->type ?? 'news';

        // Clear specific article cache (both v2 and legacy keys)
        Cache::forget("news.show.v2.{$slug}");
        Cache::forget("reviews.show.v2.{$slug}");
        Cache::forget("tech.show.v2.{$slug}");
        Cache::forget("guide.show.v2.{$slug}");

        // Also clear legacy keys just in case
        Cache::forget("news.show.{$slug}");
        Cache::forget("reviews.show.{$slug}");
        Cache::forget("tech.show.{$slug}");
        Cache::forget("guide.show.{$slug}");

        // Clear listing caches (first few pages are most important)
        for ($page = 1; $page <= 5; $page++) {
            // v2 keys
            Cache::forget("news.index.v2.page_{$page}.cat_all");
            Cache::forget("reviews.index.v2.page_{$page}.cat_all");
            Cache::forget("tech.index.v2.page_{$page}.cat_all");

            // Legacy keys
            Cache::forget("news.index.page_{$page}.cat_all");
            Cache::forget("reviews.index.page_{$page}.cat_all");
            Cache::forget("tech.index.page_{$page}.cat_all");

            // Also clear category-specific caches if we know the category
            if ($article->category) {
                $catSlug = $article->category->slug;
                Cache::forget("news.index.v2.page_{$page}.cat_{$catSlug}");
                Cache::forget("reviews.index.v2.page_{$page}.cat_{$catSlug}");
                Cache::forget("tech.index.v2.page_{$page}.cat_{$catSlug}");

                Cache::forget("news.index.page_{$page}.cat_{$catSlug}");
                Cache::forget("reviews.index.page_{$page}.cat_{$catSlug}");
                Cache::forget("tech.index.page_{$page}.cat_{$catSlug}");
            }
        }

        // Clear home page cache
        Cache::forget('home:data');

        // Clear trending
        Cache::forget('news.trending');

        // 🚀 TRIGGER NEXT.JS ON-DEMAND REVALIDATION
        // This ensures instant content updates for users
        CacheRevalidationService::revalidateArticle(
            type: $categoryType,
            slug: $slug,
            additionalPaths: ['/', '/news', '/reviews', '/hardware']
        );
    }
}
