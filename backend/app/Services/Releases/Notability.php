<?php

namespace App\Services\Releases;

use App\Models\Game;
use Illuminate\Support\Facades\DB;

/**
 * Ranks the month, honestly.
 *
 * RAWG published an "added" figure — how many people had put a game in a
 * library — and the calendar leaned on it to decide what to feature. No store
 * publishes anything like it. Wishlist counts are the storefronts' own business
 * and they keep them.
 *
 * So this does not claim to measure anticipation, because we cannot. It
 * measures how much of a release a thing is, from evidence we actually hold:
 *
 *   - How many stores carry it. A game shipping on PC, Xbox and Switch at once
 *     has a publisher behind it; a PC-only upload usually does not. This is by
 *     far the strongest signal available and is weighted accordingly.
 *   - How much the publisher bothered to prepare — screenshots, a trailer, a
 *     written description.
 *   - How many of our own visitors wishlisted it. Small today, and the only
 *     part of this that is genuinely about anticipation, so it counts double
 *     per head once there are heads to count.
 *
 * The calendar should say what this is when it presents it. "Biggest this
 * month" is true; "most anticipated" would not be.
 */
class Notability
{
    private const PER_STORE = 40;

    private const PER_SCREENSHOT = 2;

    private const HAS_TRAILER = 15;

    private const HAS_DESCRIPTION = 10;

    private const PER_WISHLIST = 20;

    /** Recompute for every entry the aggregator owns. */
    public function rescore(): int
    {
        $wishlists = DB::table('user_games')
            ->where('status', 'wishlist')
            ->selectRaw('game_id, count(*) as tally')
            ->groupBy('game_id')
            ->pluck('tally', 'game_id');

        $updated = 0;

        Game::query()
            ->whereNotNull('match_key')
            ->with('storeLinks')
            ->chunkById(500, function ($games) use ($wishlists, &$updated) {
                foreach ($games as $game) {
                    $score = $this->scoreFor($game, (int) ($wishlists[$game->id] ?? 0));

                    if ($game->hype_score !== $score) {
                        $game->forceFill(['hype_score' => $score])->save();
                        $updated++;
                    }
                }
            });

        return $updated;
    }

    public function scoreFor(Game $game, int $wishlists = 0): int
    {
        $stores = $game->storeLinks->pluck('store')->unique()->count();

        return (int) round(
            $stores * self::PER_STORE
            + min(count($game->screenshots ?? []), 10) * self::PER_SCREENSHOT
            + (count($game->videos ?? []) ? self::HAS_TRAILER : 0)
            + (filled($game->description) ? self::HAS_DESCRIPTION : 0)
            + $wishlists * self::PER_WISHLIST
        );
    }
}
