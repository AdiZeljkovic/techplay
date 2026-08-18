<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Guide;
use App\Models\Media;
use App\Services\AltTextService;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

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

    /**
     * Bodies, held once.
     *
     * Most pictures in the library are not anybody's cover — they sit inside
     * the copy. 452 of the 538 undescribed ones are in some article's or
     * guide's body, which is both where their owner is and where the best
     * description already lives: 236 of the inline `<img>` tags carry an `alt`
     * an editor wrote by hand.
     *
     * @var Collection<int, object>|null
     */
    private $bodies = null;

    /** @return Collection<int, object> */
    private function bodies()
    {
        return $this->bodies ??= Article::select('id', 'title', 'content')->get()
            ->concat(Guide::select('id', 'title', 'content')->get());
    }

    /**
     * The piece a picture appears inside, and the alt somebody already gave it.
     *
     * @return array{0: string|null, 1: string|null} [naslov teksta, alt iz HTML-a]
     */
    private function inBody(string $path): array
    {
        $needle = basename($path);

        foreach ($this->bodies() as $piece) {
            $content = (string) $piece->content;

            if (! str_contains($content, $needle)) {
                continue;
            }

            // The tag this picture is in, and whether it was described there.
            if (preg_match_all('/<img[^>]*>/i', $content, $tags)) {
                foreach ($tags[0] as $tag) {
                    if (! str_contains($tag, $needle) || ! preg_match('/\balt\s*=\s*"([^"]{2,})"/i', $tag, $alt)) {
                        continue;
                    }

                    $written = trim($alt[1]);

                    /*
                     * Only if a person wrote it.
                     *
                     * HTMLPurifier stamps `alt` onto any `<img>` that lacks one,
                     * and what it stamps is the file name — so 47 pictures in the
                     * catalogue carry things like
                     * `alt="OvHlUsw3YNkaeGv7lHmVxK9j1bgyYdYe8YzUPqAy.jpg"`.
                     * Harvesting that would launder a machine's placeholder into
                     * the library as though somebody had described the picture.
                     */
                    if ($written === $needle || $written === pathinfo($needle, PATHINFO_FILENAME)) {
                        break;
                    }

                    return [$piece->title, $written];
                }
            }

            return [$piece->title, null];
        }

        return [null, null];
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

            // Not a cover, then — look for it in the copy.
            [$bodyTitle, $bodyAlt] = $owner ? [null, null] : $this->inBody($item->path);

            /*
             * The stored path is safe to offer as a name here, because
             * `suggest()` rejects a storage identifier before it reads it. So a
             * ULID path falls through to the headline, and the occasional file
             * that arrived called `nobody-uses-this-one.jpg` can describe
             * itself.
             */
            $alt = AltTextService::suggest(
                $item->original_name ?: basename($item->path),
                $owner->title ?? $bodyTitle ?? $item->title,
                // An alt an editor typed into the body beats anything derived.
                $bodyAlt,
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
