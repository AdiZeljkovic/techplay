<?php

namespace App\Observers;

use App\Http\Controllers\SitemapController;
use App\Models\Article;
use App\Models\UserGame;
use App\Notifications\GameNewsNotification;
use App\Notifications\WishlistGameReviewedNotification;
use App\Services\BountyService;
use App\Services\ContentGameLinker;
use App\Services\QuestService;
use App\Services\RevalidationService;
use App\Services\SanitizationService;
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
     * Sanitize the HTML body before it hits the database, so the frontend
     * can safely render it with dangerouslySetInnerHTML.
     */
    public function saving(Article $article): void
    {
        if ($article->isDirty('content') && is_string($article->content)) {
            $article->content = app(SanitizationService::class)
                ->sanitizeStaffContent($article->content);
        }

        // The content↔game spine: anything written about a game links to it
        // the moment it is saved, so the game page collects it and the
        // article page can show what it covers. Editors override in the
        // admin; the linker only fills silence.
        if ($article->game_id === null && filled($article->title)) {
            $article->game_id = app(ContentGameLinker::class)->match(
                data_get($article->review_data, 'game_title'),
                $article->title,
                $article->published_at?->year ?? now()->year,
            );
        }
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

        if (! $article->relationLoaded('category')) {
            $article->load('category');
        }

        $this->clearApiListingCache($article->category->type ?? null);
        $this->clearArticleShowCache($article->slug);
        $this->clearAuthorCache($article);

        if ($article->category) {
            // Cache purging, sitemaps, search-engine pings and the notification
            // walk all leave the request now. Publishing used to hold the
            // editor's save for as long as those took, and showed a timeout on
            // a write that had already succeeded.
            \App\Jobs\PublishArticleFanout::dispatch(
                $article->id,
                $article->wasRecentlyCreated || $article->wasChanged('status'),
            );
        }
    }

    /**
     * The publish fan-out itself, called from the queued job. Kept here because
     * every step it needs is a method on this observer.
     */
    public function runPublishFanout(Article $article, bool $isNewlyPublished): void
    {
        if (! $article->relationLoaded('category')) {
            $article->load('category');
        }

        $categoryPath = $this->getCategoryPath($article->category->type ?? null);

        if (! $categoryPath) {
            return;
        }

        $this->revalidationService->revalidateArticle($article->slug, $categoryPath);

        if ($article->is_featured_in_hero) {
            $this->revalidationService->revalidateHomepage();
        }

        if (! $isNewlyPublished) {
            return;
        }

        $this->regenerateNewsSitemap();
        $this->pingSearchEngines($article->slug, $categoryPath);

        // Notify wishlisted users when a review is published.
        if ($article->game_id && $article->review_score && in_array($article->category->type, ['review', 'reviews'])) {
            $this->notifyWishlisters($article);
        }

        // Notify all users tracking this game when any article about it is published.
        if ($article->game_id && in_array($article->category->type, ['news', 'guide', 'guides'])) {
            $this->notifyGameTrackers($article, $categoryPath);
        }

        // Award bounty + quest progress to the author on first publish.
        $this->rewardAuthor($article);
    }

    /**
     * Handle the Article "deleted" event
     *
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
     * Clear author page cache when their article is published/updated.
     */
    protected function clearAuthorCache(Article $article): void
    {
        if (! $article->relationLoaded('author')) {
            $article->load('author:id,author_slug');
        }

        $authorSlug = $article->author?->author_slug;
        if ($authorSlug) {
            Cache::forget("author.show.v1.{$authorSlug}");
        }
    }

    /**
     * Clear individual article show caches across all possible cache keys for this slug.
     * Needed because ReviewResource and TechResource both use Article model but different cache keys.
     */
    protected function clearArticleShowCache(string $slug): void
    {
        Cache::forget("news.show.v2.{$slug}");
        Cache::forget("tech.show.v2.{$slug}");
        Cache::forget("reviews.show.v2.{$slug}");
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
            $content = app(SitemapController::class)->news()->getContent();
            File::put(public_path('sitemap-news.xml'), $content);
        } catch (\Throwable $e) {
            \Log::warning('News sitemap regeneration failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Reward the article author on first publish with bounty + quest progress.
     */
    protected function rewardAuthor(Article $article): void
    {
        try {
            if (! $article->author_id) {
                return;
            }
            if (! $article->relationLoaded('author')) {
                $article->load('author');
            }
            if (! $article->author) {
                return;
            }

            $isReview = $article->category && in_array($article->category->type, ['review', 'reviews']);
            $bounty = $isReview ? 75 : 30;
            $reason = $isReview ? "Review published: {$article->title}" : "Article published: {$article->title}";

            app(BountyService::class)->award($article->author, $bounty, $reason, 'milestone');
            app(QuestService::class)->progress($article->author, 'article_published', 1);

            if ($isReview) {
                app(QuestService::class)->progress($article->author, 'review_published', 1);
            }
        } catch (\Throwable) {
            // Never block article publish
        }
    }

    /**
     * Notify users who wishlisted the reviewed game.
     */
    protected function notifyWishlisters(Article $article): void
    {
        try {
            if (! $article->relationLoaded('game')) {
                $article->load('game');
            }
            if (! $article->game) {
                return;
            }

            $wishlisters = UserGame::where('game_id', $article->game_id)
                ->where('status', 'wishlist')
                ->with('user')
                ->get();

            foreach ($wishlisters as $entry) {
                if (! $entry->user) {
                    continue;
                }
                try {
                    $entry->user->notify(new WishlistGameReviewedNotification(
                        $article->game,
                        $article,
                        (float) $article->review_score,
                    ));
                } catch (\Throwable) {
                }
            }
        } catch (\Throwable) {
            // Never block article publish
        }
    }

    /**
     * Notify all users who have this game tracked (any status except 'dropped')
     * when a news article or guide about it is published.
     */
    protected function notifyGameTrackers(Article $article, string $categoryPath): void
    {
        try {
            if (! $article->relationLoaded('game')) {
                $article->load('game');
            }
            if (! $article->game) {
                return;
            }

            $trackers = UserGame::where('game_id', $article->game_id)
                ->where('status', '!=', 'dropped')
                ->where('user_id', '!=', $article->author_id) // don't notify the article's own author
                ->with('user')
                ->get();

            foreach ($trackers as $entry) {
                if (! $entry->user) {
                    continue;
                }
                try {
                    $entry->user->notify(new GameNewsNotification($article->game, $article, $categoryPath));
                } catch (\Throwable) {
                }
            }
        } catch (\Throwable) {
            // Never block article publish
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
                    'host' => parse_url($siteUrl, PHP_URL_HOST),
                    'key' => $indexNowKey,
                    'keyLocation' => "{$siteUrl}/{$indexNowKey}.txt",
                    'urlList' => [$articleUrl],
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
