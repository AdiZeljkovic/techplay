<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\Article;
use App\Support\Copy;
use Illuminate\Support\Facades\App;

class ContentObserver
{
    /**
     * Handle the Article "saving" event.
     */
    public function saving(Article $article): void
    {
        if ($article->isDirty('content') && $article->content) {
            // Was `str_word_count(strip_tags(...))`, which welded a word to the
            // next one at every </p> and split words at every diacritic. See
            // `Copy::words()` for what that cost measured across the catalogue.
            $article->reading_time = Copy::readingMinutes($article->content);
        }
    }

    /**
     * Handle the Article "saved" event.
     *
     * This is the only place an article is submitted to IndexNow. The publish
     * fan-out used to do it as well, so a first publish went out twice — and
     * with a different key, because the two read different settings.
     */
    public function saved(Article $article): void
    {
        if ($article->status === 'published') {
            $this->submitUrl($article);
        }
    }

    /**
     * Handle the Article "deleted" event.
     */
    public function deleted(Article $article): void
    {
        if ($article->status === 'published') {
            $this->submitUrl($article);
        }
    }

    protected function submitUrl(Article $article)
    {
        if (App::environment('local')) {
            return;
        }

        // Assuming frontend URL pattern
        // Was env() with a hard-coded default. It produced the right URL only
        // because the default happened to match production.
        $frontendUrl = rtrim((string) config('app.site_url'), '/');

        /*
         * The section the article is actually served under.
         *
         * This asked only whether the piece was a review and sent everything
         * else to /news/ — so every hardware article was announced to Bing at a
         * URL that answers 404, and every guide-typed one too. Category is
         * nullable, and news is the right default for a piece without one,
         * because that is where an uncategorised article is rendered.
         */
        $path = match ($article->category?->type) {
            'reviews', 'review' => 'reviews',
            'tech', 'hardware' => 'hardware',
            'guides', 'guide' => 'guides',
            default => 'news',
        };

        SubmitIndexNow::dispatch("{$frontendUrl}/{$path}/{$article->slug}");
    }
}
