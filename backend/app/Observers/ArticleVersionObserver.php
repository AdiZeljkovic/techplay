<?php

namespace App\Observers;

use App\Models\Article;
use App\Models\ContentVersion;
use Illuminate\Support\Facades\Auth;

class ArticleVersionObserver
{
    public function updating(Article $article): void
    {
        // Save a snapshot only if title or content is changing
        if (! $article->isDirty(['title', 'content'])) {
            return;
        }

        ContentVersion::create([
            'versionable_type' => Article::class,
            'versionable_id' => $article->id,
            'created_by' => Auth::id() ?? $article->author_id,
            'title' => $article->getOriginal('title'),
            'content' => $article->getOriginal('content'),
            'change_summary' => 'Auto-saved before edit',
        ]);
    }
}
