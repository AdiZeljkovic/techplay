<?php

namespace App\Jobs;

use App\Models\Article;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Everything that has to happen *after* an article is published, off the
 * request that published it.
 *
 * It used to run inline in the observer: revalidate the article page, maybe
 * the homepage, regenerate the news sitemap, ping the search engines, then walk
 * the wishlist and tracker tables sending notifications. Each of those is an
 * outbound HTTP call or a table scan, and together they held the editor's
 * Filament save for fifteen to thirty seconds — and showed them a timeout when
 * the frontend was slow, on a write that had already succeeded.
 *
 * The work is the same; only the waiting moved.
 */
class PublishArticleFanout implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /** @var int[] */
    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly int $articleId,
        public readonly bool $isNewlyPublished,
    ) {}

    public function handle(): void
    {
        $article = Article::with('category')->find($this->articleId);

        if (! $article || $article->status !== 'published') {
            return;
        }

        // The observer holds the actual steps; this job decides when they run.
        app(\App\Observers\ArticleObserver::class)
            ->runPublishFanout($article, $this->isNewlyPublished);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Publish fanout failed', [
            'article_id' => $this->articleId,
            'error' => $e->getMessage(),
        ]);
    }
}
