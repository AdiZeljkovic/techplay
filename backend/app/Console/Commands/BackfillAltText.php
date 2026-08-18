<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Guide;
use App\Models\Media;
use App\Services\AltTextService;
use Illuminate\Console\Command;

/**
 * Give the pictures that carry the site a description.
 *
 * Measured before this was written: **887 of 1,167** rows in the media library
 * had no alt text, and **345 of 625** articles had none on their cover. Every
 * one of those is a picture a screen reader passes over in silence and Google
 * reads as nothing — on a site whose traffic is search.
 *
 * The source is the same one that named the library: the piece the picture
 * illustrates. `AltTextService::suggest()` prefers the original file name where
 * one was kept, falls back to that headline, and returns null rather than
 * inventing something from a storage identifier.
 *
 * Nothing already written is overwritten. A description a person typed always
 * beats one derived from a headline.
 */
class BackfillAltText extends Command
{
    protected $signature = 'images:backfill-alt {--dry-run : report what would change and write nothing}';

    protected $description = 'Fill in missing alt text for article covers and the media library';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $covers = $this->backfillCovers($dry);
        $library = $this->backfillLibrary($dry);

        $this->table(['', 'rows'], [
            ['Article covers described', $covers['filled']],
            ['  ...still without one', $covers['left']],
            ['Library pictures described', $library['filled']],
            ['  ...still without one', $library['left']],
        ]);

        if ($dry) {
            $this->info('Dry run — nothing was written.');
        }

        return self::SUCCESS;
    }

    /** @return array{filled: int, left: int} */
    private function backfillCovers(bool $dry): array
    {
        $filled = 0;
        $left = 0;

        $missing = fn ($query) => $query
            ->whereNotNull('featured_image_url')
            ->where('featured_image_url', '<>', '')
            ->where(fn ($q) => $q->whereNull('featured_image_alt')->orWhere('featured_image_alt', ''));

        foreach ($missing(Article::query())->get(['id', 'title', 'featured_image_url', 'featured_image_alt']) as $article) {
            $alt = AltTextService::suggest(null, $article->title);

            if ($alt === null) {
                $left++;

                continue;
            }

            $filled++;

            if (! $dry) {
                // No events: this is a description, not a publish. Firing the
                // observer would revalidate the frontend 345 times over.
                Article::withoutEvents(fn () => Article::whereKey($article->id)
                    ->update(['featured_image_alt' => $alt]));
            }
        }

        return ['filled' => $filled, 'left' => $left];
    }

    /** @return array{filled: int, left: int} */
    private function backfillLibrary(bool $dry): array
    {
        $filled = 0;
        $left = 0;

        $rows = Media::where(fn ($q) => $q->whereNull('alt_text')->orWhere('alt_text', ''))->get();

        foreach ($rows as $item) {
            // The piece that uses this picture, by either of its two paths.
            $owner = Article::where('featured_image_url', $item->path)->first()
                ?? ($item->webp_path ? Article::where('featured_image_url', $item->webp_path)->first() : null)
                ?? Guide::where('featured_image_url', $item->path)->first();

            /*
             * The stored path is safe to offer as a name here, because
             * `suggest()` rejects a storage identifier before it reads it. So a
             * ULID path falls through to the headline, and the occasional file
             * that arrived called `nobody-uses-this-one.jpg` can describe
             * itself.
             */
            $alt = AltTextService::suggest(
                $item->original_name ?: basename($item->path),
                $owner->title ?? $item->title,
            );

            if ($alt === null) {
                $left++;

                continue;
            }

            $filled++;

            if (! $dry) {
                $item->forceFill(['alt_text' => $alt])->save();
            }
        }

        return ['filled' => $filled, 'left' => $left];
    }
}
