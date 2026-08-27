<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

/**
 * Reads the pixel size of an image the site has already stored.
 *
 * Share cards want og:image:width and og:image:height so Facebook and X can
 * draw the card without fetching and measuring the file themselves — without
 * them the first share of a piece often renders with no image at all, and the
 * first share is usually the only one.
 *
 * Two callers, one rule: the observer measures on save so new content needs
 * nothing done to it, and `seo:backfill-image-dimensions` measures what was
 * published before the columns existed. Both go through here rather than each
 * carrying its own copy of the path handling, which is the part that differs
 * between tables and is easy to get subtly wrong.
 */
class ImageDimensionService
{
    /**
     * @return array{0:int,1:int}|null  width and height, or null when unreadable
     */
    public function measure(?string $reference): ?array
    {
        if ($reference === null || trim($reference) === '') {
            return null;
        }

        $path = $this->toDiskPath($reference);

        if ($path === null || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $size = @getimagesize(Storage::disk('public')->path($path));

        if ($size === false || ($size[0] ?? 0) < 1 || ($size[1] ?? 0) < 1) {
            return null;
        }

        // The columns are unsignedSmallInteger. Anything past 65535 is not a
        // real cover, and letting the database wrap it would store a number
        // that looks plausible and is wrong.
        if ($size[0] > 65535 || $size[1] > 65535) {
            return null;
        }

        return [(int) $size[0], (int) $size[1]];
    }

    /**
     * Turn a stored reference into a path on the public disk.
     *
     * Both shapes live in the database and both point at this box: articles
     * store an absolute URL under /storage/, guides store the path relative
     * to it.
     */
    public function toDiskPath(string $reference): ?string
    {
        if (! str_starts_with($reference, 'http')) {
            return ltrim($reference, '/');
        }

        $pathPart = parse_url($reference, PHP_URL_PATH);

        if (! is_string($pathPart)) {
            return null;
        }

        $marker = '/storage/';
        $at = strpos($pathPart, $marker);

        return $at === false
            ? null
            : substr($pathPart, $at + strlen($marker));
    }
}
