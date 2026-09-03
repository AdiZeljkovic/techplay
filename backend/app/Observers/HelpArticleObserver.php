<?php

namespace App\Observers;

use App\Jobs\SubmitIndexNow;
use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\CacheService;
use App\Services\RevalidationService;
use App\Services\SanitizationService;
use Illuminate\Support\Facades\Cache;

/**
 * Keeping the help centre honest after every edit.
 *
 * A help answer is the one kind of page where being out of date is worse than
 * being absent: somebody follows it step by step and it does not work. So a
 * correction has to reach readers immediately, and every one of the three
 * layers between the row and the browser has to be told.
 */
class HelpArticleObserver
{
    public function __construct(protected RevalidationService $revalidationService) {}

    /**
     * Sanitise the body before it reaches the database, so the frontend can
     * render it with dangerouslySetInnerHTML.
     *
     * Deliberately no ContentGameLinker, unlike guides and articles. Running it
     * over these titles would file "Connect your Steam account" under a game
     * called Steam.
     */
    public function saving(HelpArticle $article): void
    {
        if ($article->isDirty('content') && is_string($article->content)) {
            $article->content = app(SanitizationService::class)
                ->sanitizeStaffContent($article->content);
        }
    }

    public function created(HelpArticle $article): void
    {
        if ($article->status === 'published') {
            $this->pingSearchEngines($article);
        }

        $this->purge($article);
    }

    public function updated(HelpArticle $article): void
    {
        // Unconditionally, arriving or leaving. An answer pulled back has to
        // reach the frontend as loudly as one going up — the same bug the guide
        // observer's own comment records, where the API answered 404 while Next
        // kept serving the copy it already held.
        $this->purge($article);

        if ($article->status === 'published' && $article->isDirty('status')) {
            $this->pingSearchEngines($article);
        }
    }

    public function deleted(HelpArticle $article): void
    {
        $this->purge($article);
    }

    /**
     * Redis, then Next.
     *
     * Both cache spellings come from CacheService, which is the only place that
     * knows how a key is built — spelling one here by hand is how the guides
     * listing came to be cleared a version behind what the controller wrote.
     */
    protected function purge(HelpArticle $article): void
    {
        Cache::forget(CacheService::articleShowKey('help', $article->slug));
        CacheService::forgetListings('help');

        /*
         * Both topics when an answer has moved, or the topic it left keeps
         * listing it. `getOriginal()` is the only thing that still knows where
         * it came from, and only inside this hook.
         */
        $slugs = array_values(array_unique(array_filter([
            $article->category?->slug,
            HelpCategory::find($article->getOriginal('help_category_id'))?->slug,
        ])));

        /*
         * Paths for the index and the topic pages, tags for the answer itself.
         *
         * Not `revalidateArticle()`: the answer lives on a dynamic route, and
         * `revalidatePath` is a no-op for one in Next 16 — the tag is the half
         * that actually reaches it. The index and topic pages are static, so
         * they take the path half.
         */
        $this->revalidationService->revalidatePaths(
            array_merge(['/help'], array_map(fn ($slug) => "/help/{$slug}", $slugs)),
            array_merge(
                ['help', "help-article-{$article->slug}"],
                array_map(fn ($slug) => "help-category-{$slug}", $slugs),
            ),
        );
    }

    /** Through the one job that knows how — see ArticleObserver for the why. */
    protected function pingSearchEngines(HelpArticle $article): void
    {
        $topic = $article->category?->slug;

        if ($topic === null) {
            return;
        }

        SubmitIndexNow::dispatch(
            rtrim((string) config('app.help_url'), '/')."/{$topic}/{$article->slug}"
        );
    }
}
