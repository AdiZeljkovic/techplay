<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\Article;
use Illuminate\Support\Facades\App;

class ContentObserver
{
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
        $frontendUrl = env('FRONTEND_URL', 'https://techplay.gg');
        $path = $article->category->type === 'reviews' ? 'reviews' : 'news';
        $url = "{$frontendUrl}/{$path}/{$article->slug}";

        SubmitIndexNow::dispatch($url);
    }
}
