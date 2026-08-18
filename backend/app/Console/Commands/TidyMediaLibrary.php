<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Guide;
use App\Models\Media;
use Illuminate\Console\Command;

/**
 * Make the media library describe pictures instead of files.
 *
 * It was built entirely by `media:sync`, which walks storage and writes one row
 * per file. That produced two problems at once, both visible the moment anyone
 * opened "Choose from library":
 *
 * **Every picture was in there twice.** `ImageOptimizationService` writes
 * `x.webp` beside `x.jpg`, and a walk of the disk sees two files. Eighteen
 * pictures, thirty-six rows. A conversion is a property of an image, not
 * another image, and `webp_path` is the column that says so.
 *
 * **Every title was a storage name.** `title` was set to the file name, and the
 * file name is a ULID. All 36 rows were titled things like
 * `01KEQ5KW66WJGTKV4KBRH7WEH4`, which is not a title — it is the absence of one
 * wearing a title's clothes. Nulling them lets the list say "Untitled" honestly,
 * and lets somebody type a real one.
 *
 * Nothing on disk is touched. Only rows.
 */
class TidyMediaLibrary extends Command
{
    protected $signature = 'media:tidy {--dry-run : report what would change and write nothing}';

    protected $description = 'Fold WebP derivatives into their originals and clear titles that are only storage names';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $folded = 0;
        $cleared = 0;

        /*
         * Responsive variants are not pictures.
         *
         * `ImageOptimizationService` writes `x_thumb.webp`, `x_medium.webp` and
         * `x_large.webp` beside every image it processes, and a walk of the disk
         * counts each as its own entry — 294 of the 1,461 rows, exactly 98 of
         * each size. They are regenerable crops of something already in here,
         * and nobody picking cover art wants to be offered the thumbnail of it.
         *
         * Only the row goes; the file stays where the frontend expects it.
         */
        $variants = 0;

        foreach (Media::pluck('path', 'id') as $id => $path) {
            if (! preg_match('/_(thumb|small|medium|large|xl|xxl)\.[a-z0-9]+$/i', (string) $path)) {
                continue;
            }

            $variants++;

            if (! $dry) {
                Media::whereKey($id)->delete();
            }
        }

        // `lower(...) like`, not `ilike`: the same statement has to run on
        // PostgreSQL in production and on SQLite in the test suite.
        foreach (Media::whereRaw('lower(path) like ?', ['%.webp'])->get() as $derivative) {
            $base = preg_replace('/\.webp$/i', '', $derivative->path);

            $original = Media::where('path', $base.'.jpg')
                ->orWhere('path', $base.'.jpeg')
                ->orWhere('path', $base.'.png')
                ->first();

            if (! $original) {
                // A picture that only ever existed as WebP is its own row.
                continue;
            }

            $folded++;

            if (! $dry) {
                $original->forceFill([
                    'webp_path' => $derivative->path,
                    // The derivative may carry dimensions the original row lacks.
                    'width' => $original->width ?: $derivative->width,
                    'height' => $original->height ?: $derivative->height,
                ])->save();

                $derivative->delete();
            }
        }

        foreach (Media::whereNotNull('title')->get() as $item) {
            if ($item->title !== pathinfo($item->path, PATHINFO_FILENAME)) {
                continue;
            }

            $cleared++;

            if (! $dry) {
                $item->forceFill(['title' => null])->save();
            }
        }

        /*
         * Name what can be named.
         *
         * The original file names are gone — they were thrown away at upload
         * long before `original_name` existed, and no amount of tidying brings
         * them back. But most of these pictures are the cover of something, and
         * the thing they are the cover of has a title. `Hogwarts Legacy 2 is
         * officially being made` is a far better answer to "which picture is
         * this" than `01KEQHACPVVAHBWYCP3EXKT1D0`.
         */
        $named = 0;

        foreach (Media::whereNull('title')->get() as $item) {
            $owner = Article::where('featured_image_url', $item->path)->first()
                ?? ($item->webp_path ? Article::where('featured_image_url', $item->webp_path)->first() : null)
                ?? Guide::where('featured_image_url', $item->path)->first();

            if (! $owner) {
                continue;
            }

            $named++;

            if (! $dry) {
                $item->forceFill([
                    'title' => $owner->title,
                    // And the alt text somebody already wrote for it.
                    'alt_text' => $item->alt_text ?: ($owner->featured_image_alt ?? null),
                ])->save();
            }
        }

        $this->table(['', 'rows'], [
            ['Responsive variants removed', $variants],
            ['WebP rows folded into their original', $folded],
            ['Titles that were only a storage name', $cleared],
            ['Named after the piece they illustrate', $named],
            ['Left in the library', $dry ? Media::count().' (unchanged)' : Media::count()],
        ]);

        if ($dry) {
            $this->info('Dry run — nothing was written.');
        }

        return self::SUCCESS;
    }
}
