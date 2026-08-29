<?php

namespace App\Support;

/**
 * The TechPlay score: sixty per cent the review, forty per cent the readers.
 *
 * It was written twice — once in GameController for the game page, once in
 * GameRatingController for the ratings widget that sits on that same page. The
 * arithmetic agreed. The inputs did not: the widget counted only finished
 * ratings (`is_draft = false`) while the page counted every row, so a game with
 * one unfinished draft rating showed one number in the header and a different
 * one a few hundred pixels below it.
 *
 * Nothing here queries. Each caller already has its own reason to read the data
 * the way it does — the widget needs the count and the average for its own
 * payload anyway — so what is shared is the part that must not drift: the
 * conversion, the weights, and what happens when only one side has an opinion.
 */
final class TechplayScore
{
    /** Editorial weight. The review is the site's own judgement. */
    private const EDITORIAL_WEIGHT = 0.6;

    /**
     * Reader stars on the score's own scale.
     *
     * Ratings are stored out of five and the score is out of ten, so the
     * average doubles. Null when nobody has rated it — which is not the same as
     * zero, and printing zero would libel the game.
     */
    public static function community(?float $starAverage, int $count): ?float
    {
        if ($count < 1 || $starAverage === null) {
            return null;
        }

        return round($starAverage * 2, 1);
    }

    /**
     * The blend, or whichever half exists.
     *
     * A game with a review and no ratings scores its review; one with ratings
     * and no review scores its readers. With neither there is no score, and the
     * page says so rather than inventing one.
     */
    public static function blend(?float $editorial, ?float $community): ?float
    {
        return match (true) {
            $editorial !== null && $community !== null => round(
                self::EDITORIAL_WEIGHT * $editorial + (1 - self::EDITORIAL_WEIGHT) * $community,
                1,
            ),
            $editorial !== null => round($editorial, 1),
            $community !== null => $community,
            default => null,
        };
    }
}
