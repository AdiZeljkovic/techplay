<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PublishScheduledArticles extends Command
{
    protected $signature = 'articles:publish-scheduled';

    protected $description = 'Publish articles scheduled for release at or before now';

    /**
     * Publish one at a time, through the model.
     *
     * This was a single `whereIn(...)->update()`. A query-builder update fires
     * no model events, so a scheduled article flipped to `published` in the
     * database and nothing else happened: no cache cleared, no ISR purge, no
     * news sitemap entry, no IndexNow ping, no Discord announcement, no
     * notification to anyone tracking the game, no payout to the author. It
     * reached readers whenever a listing TTL happened to lapse.
     *
     * The hand-rolled revalidation that stood in for the observers could never
     * have run either: it read `services.revalidate.token` and
     * `services.revalidate.url`, and the only key that exists is
     * `revalidate.secret_token`. Both resolved to null, so the block was
     * skipped in silence — and what it would have sent was a path purge, which
     * Next 16 ignores on a dynamic route.
     *
     * A row that refuses to save is logged and stepped over. This runs every
     * minute; one article with a bad payload must not hold back the rest.
     */
    public function handle(): void
    {
        $articles = Article::where('status', 'scheduled')
            ->where('published_at', '<=', now())
            ->with('category')
            ->get();

        if ($articles->isEmpty()) {
            return;
        }

        $published = [];

        foreach ($articles as $article) {
            try {
                $article->update(['status' => 'published']);
                $published[] = $article->id;
            } catch (\Throwable $e) {
                Log::error('PublishScheduledArticles: article refused to publish', [
                    'id' => $article->id,
                    'slug' => $article->slug,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($published !== []) {
            Log::info('PublishScheduledArticles: published '.count($published).' articles', ['ids' => $published]);
        }

        $this->info('Published '.count($published).' scheduled article(s).');
    }
}
