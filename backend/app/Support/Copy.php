<?php

namespace App\Support;

/**
 * Measurements on a piece of writing, in one place.
 *
 * There is one function here and it exists because two callers had their own
 * copy of it and both were wrong in the same two ways — the SEO readout in the
 * article rail, and `ContentObserver`, which stamps `reading_time` on every
 * save. After the readout was fixed the two would have disagreed about the
 * length of the same article, which is the drift this project keeps paying for.
 */
class Copy
{
    /**
     * How many words are in a piece of rich text.
     *
     * Both faults this replaces were measured on the live catalogue of 625
     * articles, where the two counts disagree on 594 of them:
     *
     * **Tags were dropped, not spaced.** `strip_tags('<p>one</p><p>two</p>')` is
     * `onetwo` — one word. Every paragraph and heading boundary welded two words
     * together, so the count came out lowest on exactly the long, well-structured
     * pieces it was meant to reward. Worst case here: 104 words.
     *
     * **`str_word_count` reads bytes against an ASCII letter list.** In a
     * Bosnian sentence it breaks at every č, ć, ž, š and đ, and counts the
     * fragments. On one 886-word review it returned 895.
     */
    public static function words(string $html): int
    {
        $text = trim(preg_replace('/\s+/u', ' ', strip_tags(preg_replace('/<[^>]*>/', ' ', $html))));

        if ($text === '') {
            return 0;
        }

        return count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY));
    }

    /**
     * Minutes to read, at the 200 words-per-minute the site has always assumed.
     */
    public static function readingMinutes(string $html): int
    {
        return max(1, (int) ceil(static::words($html) / 200));
    }
}
