<?php

namespace App\Console\Commands;

use App\Filament\Components\SeoFields;
use App\Models\Article;
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
    protected $signature = 'seo:fix-truncated-titles {--apply : Write the changes}';

    protected $description = 'Rewrite meta titles that end in an ellipsis so they break on a word';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');

        $suspects = Article::query()
            ->whereNotNull('meta_title')
            ->where(fn ($q) => $q->where('meta_title', 'like', '%...')->orWhere('meta_title', 'like', '%…'))
            ->get(['id', 'title', 'meta_title']);

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
                $article->saveQuietly();
            }
        }

        $this->table(['id', 'before', 'after'], $rows);
        $this->newLine();

        $this->line($apply
            ? "Rewrote {$changed} of {$suspects->count()}."
            : "{$changed} of {$suspects->count()} would be rewritten. Re-run with --apply.");

        return self::SUCCESS;
    }
}
