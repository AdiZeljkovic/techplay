<?php

namespace App\Console\Commands;

use App\Filament\Components\SeoFields;
use App\Models\Article;
use App\Services\RevalidationService;
use Illuminate\Console\Command;

/**
 * Repairs meta titles that were cut mid-word by the old "Fill from Article
 * Title" button, which wrote substr($title, 0, 57).'...'.
 *
 * Those strings are the page's <title> and its og:title, so a share card and a
 * browser tab both read "…makes a surprise return to …". The button now cuts on
 * a word boundary; this brings the rows already saved into line.
 *
 * Dry by default. Nothing is written until --apply.
 */
class FixTruncatedSeoTitles extends Command
{
    protected $signature = 'seo:fix-truncated-titles
        {--apply : Write the changes}
        {--revalidate-recent= : Skip the rewrite and only purge the ISR cache for articles touched in the last N hours}';

    protected $description = 'Rewrite meta titles that end in an ellipsis so they break on a word';

    public function handle(RevalidationService $revalidation): int
    {
        // Recovery path for a run that wrote titles before this command knew to
        // purge them. Rewritten rows no longer end in an ellipsis, so the
        // search below can never find them a second time — the only handle left
        // on them is when they were touched.
        $hours = (int) $this->option('revalidate-recent');

        if ($hours > 0) {
            return $this->revalidateRecent($revalidation, $hours);
        }

        $apply = (bool) $this->option('apply');

        $suspects = Article::query()
            ->with('category')
            ->whereNotNull('meta_title')
            ->where(fn ($q) => $q->where('meta_title', 'like', '%...')->orWhere('meta_title', 'like', '%…'))
            ->get();

        if ($suspects->isEmpty()) {
            $this->info('No truncated meta titles found.');

            return self::SUCCESS;
        }

        $rows = [];
        $changed = 0;

        foreach ($suspects as $article) {
            // An ellipsis somebody typed on purpose is not a truncation. Only
            // rows that look like a cut of their own title are touched.
            $stem = rtrim((string) $article->meta_title, '.… ');

            if ($stem === '' || ! str_starts_with($article->title, mb_substr($stem, 0, max(1, mb_strlen($stem) - 1)))) {
                $rows[] = [$article->id, mb_substr($article->meta_title, 0, 46), '— left alone'];

                continue;
            }

            $fixed = SeoFields::shorten($article->title, 60);
            $rows[] = [$article->id, mb_substr($article->meta_title, 0, 46), mb_substr($fixed, 0, 46)];
            $changed++;

            if ($apply) {
                $article->meta_title = $fixed;

                // Quietly on purpose: the observer's saved() hook fans out to
                // IndexNow, Discord and the homepage, and none of that belongs
                // to a copy-editing pass over eighty-five old articles.
                $article->saveQuietly();

                // But the <title> a reader sees lives in the ISR cache, so a
                // database that is right and a cache that is stale means
                // nothing changed for anybody. One path purged, nothing else.
                $this->purge($revalidation, $article);
            }
        }

        $this->table(['id', 'before', 'after'], $rows);
        $this->newLine();

        $this->line($apply
            ? "Rewrote {$changed} of {$suspects->count()}."
            : "{$changed} of {$suspects->count()} would be rewritten. Re-run with --apply.");

        return self::SUCCESS;
    }

    /**
     * Purge the ISR cache for every article updated in the last N hours.
     */
    private function revalidateRecent(RevalidationService $revalidation, int $hours): int
    {
        $touched = Article::with('category')
            ->where('updated_at', '>=', now()->subHours($hours))
            ->get();

        $this->info("Purging {$touched->count()} article(s) updated in the last {$hours}h…");

        $done = 0;

        foreach ($touched as $article) {
            if ($this->purge($revalidation, $article)) {
                $done++;
            }
        }

        $this->info("Purged {$done}. ✓");

        return self::SUCCESS;
    }

    /** One article's page, and nothing around it. */
    private function purge(RevalidationService $revalidation, Article $article): bool
    {
        $path = match ($article->category?->type) {
            'news' => 'news',
            'review', 'reviews' => 'reviews',
            'tech', 'hardware' => 'hardware',
            'guide', 'guides' => 'guides',
            default => null,
        };

        if (! $path) {
            return false;
        }

        try {
            return $revalidation->revalidateArticle($article->slug, $path);
        } catch (\Throwable $e) {
            $this->warn("  ! {$article->slug}: {$e->getMessage()}");

            return false;
        }
    }
}
