<?php

namespace App\Observers;

use App\Models\Article;
use App\Services\RevalidationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ArticleObserver
{
    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * Handle the Article "saved" event (fires on both create and update)
     *
     * @param  \App\Models\Article  $article
     * @return void
     */
    public function saved(Article $article)
    {
        \Log::info('ArticleObserver::saved fired', [
            'id' => $article->id,
            'slug' => $article->slug,
            'status' => $article->status,
            'has_category' => isset($article->category),
        ]);

        // Only revalidate if article is published
        if ($article->status === 'published' && $article->slug) {
            // Load category if not already loaded
            if (!$article->relationLoaded('category')) {
                $article->load('category');
            }

            // Clear API listing caches so bots/clients see fresh data immediately
            $this->clearApiListingCache($article->category->type ?? null);

            if ($article->category) {
                // Determine category path based on category type
                $categoryPath = $this->getCategoryPath($article->category->type);

                \Log::info('Triggering revalidation', [
                    'slug' => $article->slug,
                    'category_type' => $article->category->type,
                    'category_path' => $categoryPath,
                ]);

                if ($categoryPath) {
                    // Revalidate article page
                    $this->revalidationService->revalidateArticle($article->slug, $categoryPath);

                    // Revalidate homepage if article is featured
                    if ($article->is_featured_in_hero) {
                        $this->revalidationService->revalidateHomepage();
                    }

                    // Ping search engines for instant indexing
                    $this->pingSearchEngines($article->slug, $categoryPath);
                }
            } else {
                \Log::warning('Article has no category', ['id' => $article->id]);
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
     * Notify search engines of newly published/updated article via IndexNow + Google sitemap ping.
     * Runs async (queue) if QUEUE_CONNECTION != sync; otherwise fire-and-forget with short timeout.
     */
    protected function pingSearchEngines(string $slug, string $categoryPath): void
    {
        $siteUrl = rtrim(config('app.url', 'https://techplay.gg'), '/');
        $articleUrl = "{$siteUrl}/{$categoryPath}/{$slug}";

        // ── IndexNow (Bing, Yandex, and others) ────────────────────────────────
        $indexNowKey = env('INDEXNOW_KEY');
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
