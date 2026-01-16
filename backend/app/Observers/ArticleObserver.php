<?php

namespace App\Observers;

use App\Events\ArticlePublished;
use App\Models\Article;

class ArticleObserver
{
    /**
     * Handle the Article "created" event.
     */
    public function created(Article $article): void
    {
        // If created with published status, broadcast immediately
        if ($article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();
        }
    }

    /**
     * Handle the Article "updated" event.
     */
    public function updated(Article $article): void
    {
        // Check if status changed TO 'published'
        if ($article->isDirty('status') && $article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();
        }
    }
}
