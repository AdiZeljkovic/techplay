<?php

namespace App\Services\Releases;

/**
 * Reduces a store's title to a key we can compare across stores.
 *
 * The same game arrives under four spellings: Steam writes "Lies of P: Complete
 * Edition", Nintendo writes "Lou's Lagoon – Nintendo Switch™ 2 Edition", and
 * everyone disagrees about trademark symbols. This strips the packaging and
 * leaves the game.
 *
 * The one rule that keeps it safe: decorations are only ever removed from the
 * END of a title. "Deluxe Paint" and "Gold Rush" are games, not editions, and a
 * normaliser that matched those words anywhere would erase them.
 */
class TitleNormalizer
{
    /**
     * Edition markers, longest first so "game of the year edition" is consumed
     * whole before "edition" can take a bite out of it.
     */
    private const EDITIONS = [
        'game of the year edition',
        'complete edition',
        'definitive edition',
        'collectors edition',
        'collector edition',
        'anniversary edition',
        'remastered edition',
        'enhanced edition',
        'ultimate edition',
        'deluxe edition',
        'special edition',
        'premium edition',
        'standard edition',
        'digital edition',
        'legacy edition',
        'gold edition',
        'goty edition',
        'day one edition',
        'director s cut',
        'directors cut',
        'complete pack',
        'bundle',
        'goty',
    ];

    /**
     * Platform packaging. A store naming its own hardware in the title tells us
     * nothing about which game it is.
     */
    private const PLATFORM_MARKERS = [
        'nintendo switch 2 edition',
        'nintendo switch edition',
        'switch 2 edition',
        'xbox series x s',
        'xbox series x',
        'xbox series s',
        'xbox one edition',
        'playstation 5 edition',
        'playstation 4 edition',
        'ps5 ps4',
        'ps4 ps5',
        'ps5',
        'ps4',
        'windows edition',
        'pc edition',
        'for pc',
    ];

    /** The comparable form of a title. */
    public function key(string $title): string
    {
        $s = $this->flatten($title);

        // Strip trailing decorations repeatedly: "Complete Edition (PS5)"
        // leaves two layers, and removing one exposes the next.
        $changed = true;
        while ($changed) {
            $changed = false;

            foreach ([...self::PLATFORM_MARKERS, ...self::EDITIONS] as $marker) {
                if (str_ends_with($s, ' '.$marker)) {
                    $s = trim(substr($s, 0, -strlen($marker) - 1));
                    $changed = true;
                }
            }

            // "(PS4 & PS5)" sheds one platform and leaves the conjunction
            // dangling, which then hides the other one behind it.
            foreach ([' and', ' or', ' plus'] as $connective) {
                if (str_ends_with($s, $connective)) {
                    $s = trim(substr($s, 0, -strlen($connective)));
                    $changed = true;
                }
            }
        }

        return $s;
    }

    /** Lowercase, unaccented, punctuation-free, single-spaced. */
    private function flatten(string $title): string
    {
        $s = mb_strtolower(trim($title));

        // Trademark noise sits mid-title ("Call of Duty®: Black Ops") so it has
        // to go before anything else can line up.
        $s = str_replace(['™', '®', '©', '℠'], '', $s);

        // Abbreviations stores use interchangeably with the full word.
        $s = preg_replace('/\bed\.\s*$/u', 'edition', $s);
        $s = str_replace(' & ', ' and ', $s);

        // Accents: "Pokémon" and "Pokemon" are one game.
        if (class_exists(\Transliterator::class)) {
            $t = \Transliterator::create('Any-Latin; Latin-ASCII');
            $s = $t ? $t->transliterate($s) : $s;
        } else {
            $s = @iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s;
        }

        // Apostrophes close up ("lou's" -> "lous"); everything else becomes a
        // space so "Half-Life" and "Half Life" agree.
        $s = preg_replace('/[\'\x{2019}`]/u', '', $s);
        $s = preg_replace('/[^a-z0-9]+/u', ' ', $s);

        return trim(preg_replace('/\s+/', ' ', $s));
    }
}
