<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\Article;
use Illuminate\Support\Facades\App;

class ContentObserver
{
    /**
     * Handle the Article "saving" event.
     */
    public function saving(Article $article): void
    {
        if ($article->isDirty('content') && $article->content) {
            $wordCount = str_word_count(strip_tags($article->content));
            $article->reading_time = ceil($wordCount / 200);
        }
    }

    /**
     * Handle the Article "saved" event.
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

        // category is nullable, and this threw on any article saved without
        // one — a crash on publish, from a search-engine ping nobody needs to
        // succeed. News is the right default: it is where an uncategorised
        // article is rendered.
        $path = $article->category?->type === 'reviews' ? 'reviews' : 'news';
        $url = "{$frontendUrl}/{$path}/{$article->slug}";

        SubmitIndexNow::dispatch($url);
    }
}
