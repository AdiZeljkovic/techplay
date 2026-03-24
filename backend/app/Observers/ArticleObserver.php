<?php

namespace App\Observers;

use App\Models\Article;
use App\Services\RevalidationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class ArticleObserver
{
    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * Handle the Article "saved" event (fires on both create and update).
     * Only triggers full publish flow when article is NEWLY published.
     */
    public function saved(Article $article): void
    {
        if ($article->status !== 'published' || ! $article->slug) {
            return;
        }

        // Only act when status just changed to 'published' (not on every edit of a published article)
        $isNewlyPublished = $article->wasRecentlyCreated || $article->wasChanged('status');
        if (! $isNewlyPublished) {
            return;
        }

        if (! $article->relationLoaded('category')) {
            $article->load('category');
        }

        $this->clearApiListingCache($article->category->type ?? null);

        if ($article->category) {
            $categoryPath = $this->getCategoryPath($article->category->type);

            if ($categoryPath) {
                $this->revalidationService->revalidateArticle($article->slug, $categoryPath);

                if ($article->is_featured_in_hero) {
                    $this->revalidationService->revalidateHomepage();
                }

                $this->regenerateNewsSitemap();
                $this->pingSearchEngines($article->slug, $categoryPath);
            }
        }
    }

    /**
     * Handle the Article "deleted" event
     *
     * @param  \App\Models\Article  $article
     * @return void
     */
    public function deleted(Article $article)
    {
        // Revalidate category listing when article is deleted
        if ($article->category) {
            $categoryPath = $this->getCategoryPath($article->category->type);
            if ($categoryPath) {
                $this->revalidationService->revalidateCategory($categoryPath);
            }
        }

        // Revalidate homepage if featured article was deleted
        if ($article->is_featured_in_hero) {
            $this->revalidationService->revalidateHomepage();
        }
    }

    /**
     * Clear paginated API listing caches for the relevant category
     */
    protected function clearApiListingCache(?string $categoryType): void
    {
        // Clear first 3 pages of the affected category listing
        $prefixes = ['news', 'tech', 'reviews', 'guides'];
        $targets = $categoryType ? [$categoryType] : $prefixes;

        foreach ($targets as $type) {
            for ($page = 1; $page <= 3; $page++) {
                Cache::forget("news.index.v2.page_{$page}.cat_all");
                Cache::forget("{$type}.index.v2.page_{$page}.cat_all");
            }
        }

        // Clear trending cache
        Cache::forget('news.trending');
    }

    /**
     * Map category type to frontend URL path
     */
    protected function getCategoryPath(string $categoryType): ?string
    {
        return match ($categoryType) {
            'news' => 'news',
            'review' => 'reviews',
            'reviews' => 'reviews',
            'tech' => 'hardware',
            'hardware' => 'hardware',
            'guide' => 'guides',
            'guides' => 'guides',
            default => null,
        };
    }

    /**
     * Regenerate static sitemap-news.xml so it's immediately up to date.
     */
    protected function regenerateNewsSitemap(): void
    {
        try {
            $content = app(\App\Http\Controllers\SitemapController::class)->news()->getContent();
            \Illuminate\Support\Facades\File::put(public_path('sitemap-news.xml'), $content);
        } catch (\Throwable $e) {
            \Log::warning('News sitemap regeneration failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notify search engines of newly published article via IndexNow + Google sitemap ping.
     */
    protected function pingSearchEngines(string $slug, string $categoryPath): void
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');
        $articleUrl = "{$siteUrl}/{$categoryPath}/{$slug}";

        // ── IndexNow (Bing, Yandex, and others) ────────────────────────────────
        $indexNowKey = config('services.indexnow.key');
        if ($indexNowKey) {
            try {
                Http::timeout(5)->post('https://api.indexnow.org/indexnow', [
                    'host'        => parse_url($siteUrl, PHP_URL_HOST),
                    'key'         => $indexNowKey,
                    'keyLocation' => "{$siteUrl}/{$indexNowKey}.txt",
                    'urlList'     => [$articleUrl],
                ]);
                \Log::info("IndexNow ping sent for: {$articleUrl}");
            } catch (\Exception $e) {
                \Log::warning('IndexNow ping failed', ['error' => $e->getMessage()]);
            }
        }

        // ── Google News sitemap ping ────────────────────────────────────────────
        // Tells Google to re-crawl the news sitemap (fastest way without Indexing API)
        try {
            $sitemapUrl = urlencode("{$siteUrl}/sitemap-news.xml");
            Http::timeout(5)->get("https://www.google.com/ping?sitemap={$sitemapUrl}");
        } catch (\Exception $e) {
            \Log::warning('Google sitemap ping failed', ['error' => $e->getMessage()]);
        }
    }
}
