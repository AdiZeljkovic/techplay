<?php

namespace App\Observers;

use App\Http\Controllers\SitemapController;
use App\Jobs\PublishArticleFanout;
use App\Models\Article;
use App\Models\UserGame;
use App\Notifications\GameNewsNotification;
use App\Notifications\WishlistGameReviewedNotification;
use App\Services\BountyService;
use App\Services\CacheService;
use App\Services\ContentGameLinker;
use App\Services\DiscordAnnouncer;
use App\Services\ImageDimensionService;
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

        /*
         * Measure the cover the moment it changes, so a share card can declare
         * its size without Facebook or X having to fetch the file first.
         *
         * On the very first share that fetch usually has not happened yet, and
         * the card goes out with an empty frame — which is the share that
         * counts, because a link normally goes out once. The upload pipeline
         * already reads the width to build responsive sizes and then discards
         * it; this keeps it.
         *
         * Only on change, and only from disk — no HTTP call in a save path.
         */
        if ($article->isDirty('featured_image_url')) {
            $size = app(ImageDimensionService::class)->measure($article->featured_image_url);

            $article->featured_image_width = $size[0] ?? null;
            $article->featured_image_height = $size[1] ?? null;
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
        if (! $article->slug) {
            return;
        }

        if (! $article->relationLoaded('category')) {
            $article->load('category');
        }

        /*
         * A piece leaving `published` has to reach readers as loudly as one
         * arriving. This method returned immediately for any status other than
         * `published`, and nothing else covered the transition: the Redis entry
         * stayed, the listings stayed, and Next was never told — and article
         * pages are `revalidate = false`, so its copy had no timer to fall back
         * on. A retracted piece kept its URL, its title and its body.
         *
         * The same failure as the delete hook had until 19 Aug 2026, one status
         * to the left, which is why both now go through the same withdrawal.
         */
        if ($article->status !== 'published') {
            if ($article->wasChanged('status')) {
                $this->withdraw($article);
            }

            return;
        }

        $this->clearApiListingCache($article->category->type ?? null);
        $this->clearArticleShowCache($article->slug);
        $this->clearAuthorCache($article);

        if ($article->category) {
            // Cache purging, sitemaps, search-engine pings and the notification
            // walk all leave the request now. Publishing used to hold the
            // editor's save for as long as those took, and showed a timeout on
            // a write that had already succeeded.
            PublishArticleFanout::dispatch(
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

        // The Discord bot polled four feeds every minute to notice this — a
        // request every fifteen seconds, all day, to catch a handful of
        // publishes. It is told directly now; the poll stayed as the net that
        // catches whatever this knock misses.
        app(DiscordAnnouncer::class)->published($article, $this->discordFeed($article->category->type ?? null));

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
        $this->withdraw($article);
    }

    /**
     * Take a piece off the site — because it was deleted, or unpublished.
     *
     * Both mean the same thing to a reader, so both do the same work: forget
     * the piece itself, forget the listings it appeared in, and tell the
     * frontend about the page and its section.
     *
     * Forgetting the piece itself comes first, and used to be missing here:
     * this hook revalidated the listing and the homepage but never touched the
     * article's own key, so `{type}.show.v3.{slug}` kept answering 200 out of
     * Redis for the full TTL after the row was gone — the page stayed up with
     * its title, its body and an `index, follow` in the head.
     */
    protected function withdraw(Article $article): void
    {
        $this->clearArticleShowCache($article->slug);
        $this->clearAuthorCache($article);
        $this->clearApiListingCache($article->category?->type);

        // Revalidate category listing when article is deleted
        if ($article->category) {
            $categoryPath = $this->getCategoryPath($article->category->type);
            if ($categoryPath) {
                /*
                 * The piece's own page first, then the listing it used to be in.
                 *
                 * Clearing Redis was only half of it: the article's URL stayed
                 * up on the site, served from Next's data cache, complete with
                 * its title and body. `revalidateArticle` purges the tag that
                 * page fetches under, which is the mechanism that actually
                 * works — `revalidatePath` on a dynamic route does not.
                 */
                $this->revalidationService->revalidateArticle($article->slug, $categoryPath);
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
     * Clear the cached article in every section that could be serving it.
     *
     * One Article can be reached as news, tech, a review or a guide, so all
     * four keys go. The keys are built by CacheService rather than written out
     * here: these three lines used to say `v2` while the controllers had moved
     * on to `v3`, which meant an edited article kept serving its old copy for
     * an hour — the picture a journalist had just added simply did not appear,
     * and nothing anywhere said why.
     */
    protected function clearArticleShowCache(string $slug): void
    {
        CacheService::forgetArticle($slug);
    }

    /**
     * Clear paginated API listing caches for the relevant category
     */
    protected function clearApiListingCache(?string $categoryType): void
    {
        /*
         * Every recorded listing for the section, not the first three pages of
         * one shape of key.
         *
         * The loop that stood here forgot `{type}.index.v2.page_N.cat_all` for
         * N in 1..3. The controllers write `v3`, so it cleared nothing at all;
         * and even matched, it would have missed every page past the third and
         * every listing filtered by category or search, since those keys carry
         * an md5 of the search term. CacheService keeps a register of the keys
         * as they are written, which is what makes them findable again.
         */
        CacheService::forgetListings($categoryType);

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
     * Which of the bot's four feeds an article belongs to.
     *
     * Deliberately not getCategoryPath(): that answers with a URL segment, and
     * tech articles live under /hardware while the feed that carries them is
     * called `tech`. Two questions, two answers.
     */
    protected function discordFeed(?string $categoryType): string
    {
        return match ($categoryType) {
            'news' => 'news',
            'review', 'reviews' => 'reviews',
            'tech', 'hardware' => 'tech',
            'guide', 'guides' => 'guides',
            default => '',
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
     *
     * Paid once per article, ever — the ledger reference is the gate, and it is
     * read before the quest steps as well, because gating only the money leaves
     * a repeatable action still nudging quests forward.
     *
     * Two doors used to stand open. The fan-out ran twice while the observer
     * was registered twice, and `wasChanged('status')` is true again when a
     * piece is pulled back for a correction and re-published — so a retracted
     * article paid its author a second time on the way back out.
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

            $bounties = app(BountyService::class);
            $reference = "article:{$article->id}:published";

            if ($bounties->alreadyAwarded($article->author, $reference)) {
                return;
            }

            $isReview = $article->category && in_array($article->category->type, ['review', 'reviews']);
            $bounty = $isReview ? 75 : 30;
            $reason = $isReview ? "Review published: {$article->title}" : "Article published: {$article->title}";

            $bounties->award($article->author, $bounty, $reason, 'milestone', true, $reference);
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
