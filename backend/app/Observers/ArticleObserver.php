<?php

namespace App\Observers;

use App\Events\ArticlePublished;
use App\Models\Article;
use App\Models\Redirect;
use App\Services\IndexNowService;

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
                $existing = Redirect::where('source_path', "/news/{$oldSlug}")->first();

                if (!$existing) {
                    Redirect::create([
                        'source_path' => "/news/{$oldSlug}",
                        'target_path' => "/news/{$newSlug}",
                        'status_code' => 301,
                        'is_active' => true,
                        'note' => 'Auto: slug change',
                    ]);
                } else {
                    $existing->update(['target_path' => "/news/{$newSlug}"]);
                }
            }
        }
    }

    /**
     * Handle the Article "created" event.
     */
    public function created(Article $article): void
    {
        if ($article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();

            // Ping IndexNow
            $url = config('app.frontend_url') . "/news/{$article->slug}";
            IndexNowService::ping($url);
        }
    }

    /**
     * Handle the Article "updated" event.
     */
    public function updated(Article $article): void
    {
        if ($article->isDirty('status') && $article->status === 'published') {
            broadcast(new ArticlePublished($article))->toOthers();

            // Ping IndexNow
            $url = config('app.frontend_url') . "/news/{$article->slug}";
            IndexNowService::ping($url);
        }
    }
}

