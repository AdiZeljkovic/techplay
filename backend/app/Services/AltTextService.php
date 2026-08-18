<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Alt text for a picture, or nothing.
 *
 * The service existed before this and nothing ever called it — which was
 * lucky, because run against our own storage it produced this:
 *
 *     01KEQ5KW66WJGTKV4KBRH7WEH4.webp  ->  Keq5Kw66Wjgtkv4Kbrh7Weh4
 *     usUTo74GmWm0hYlJLA1yYR10R8...png ->  Usuto74Gmwm0Hyljla1Yyr10R8...
 *
 * Filament stores uploads under a generated identifier, so "parse the
 * filename" is not a strategy here — it is a machine reading a machine's
 * bookkeeping and calling it a description. Alt text like that is worse than
 * none at all: Google discounts it, and a screen reader reads the whole string
 * aloud, letter by letter, to somebody who asked what the picture is.
 *
 * So the one rule this now follows: **say nothing rather than say noise.**
 * `suggest()` returns null when it has nothing honest, and the callers treat
 * null as "leave it empty and let a person write one".
 */
class AltTextService
{
    /**
     * A name that is bookkeeping, not language.
     *
     * ULIDs (26 characters of Crockford base32) and Laravel's `Str::random(40)`
     * both land here: long, unbroken by any separator, and mixing letters with
     * digits. A real name almost always has a space, a hyphen or an underscore
     * in it by that length.
     */
    public static function looksLikeStorageName(string $name): bool
    {
        $stem = pathinfo($name, PATHINFO_FILENAME);

        if (mb_strlen($stem) < 16) {
            return false;
        }

        if (preg_match('/[\s\-_.]/', $stem)) {
            return false;
        }

        return (bool) preg_match('/\d/', $stem) && (bool) preg_match('/[a-z]/i', $stem);
    }

    /**
     * What to describe this picture as, or null.
     *
     * In order of how much it actually knows:
     *
     *   1. a caption somebody wrote — always the best answer;
     *   2. the name the file arrived with, if that name is language;
     *   3. the headline of the piece the picture illustrates;
     *   4. nothing.
     *
     * Step three is deliberately the bare headline, with no " - image" glued on
     * the end. Screen readers already announce that it is an image; appending
     * the word makes them say it twice.
     *
     * @param  string|null  $filename  the *original* name where one was kept, not the storage path
     * @param  string|null  $ownerTitle  the article or guide the picture belongs to
     */
    public static function suggest(?string $filename, ?string $ownerTitle = null, ?string $caption = null): ?string
    {
        $caption = trim((string) $caption);

        if (mb_strlen($caption) > 3) {
            return $caption;
        }

        if (filled($filename) && ! static::looksLikeStorageName($filename)) {
            $fromName = static::fromFilename($filename);

            if ($fromName !== null) {
                return $fromName;
            }
        }

        $ownerTitle = trim((string) $ownerTitle);

        return $ownerTitle !== '' ? $ownerTitle : null;
    }

    /**
     * A human filename, tidied into a phrase.
     *
     * `hogwarts-legacy-2-key-art.jpg` becomes `Hogwarts Legacy 2 Key Art`.
     */
    public static function fromFilename(string $filename): ?string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);

        // Camera and export prefixes carry no meaning: IMG_1234, screenshot-3.
        $name = preg_replace('/^(img|image|photo|pic|screenshot|ss|cover|dsc)[-_]*/i', '', $name);

        // A leading run of digits is a date or a counter, never a description.
        $name = preg_replace('/^[\d_-]+/', '', $name);

        $name = preg_replace('/\s+/u', ' ', trim(str_replace(['-', '_', '.'], ' ', $name)));

        if (mb_strlen($name) < 3) {
            return null;
        }

        // What is left has to still be words, not the tail of an identifier.
        if (static::looksLikeStorageName($name)) {
            return null;
        }

        return Str::title($name);
    }
}
