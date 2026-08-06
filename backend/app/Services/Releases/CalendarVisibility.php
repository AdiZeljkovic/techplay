<?php

namespace App\Services\Releases;

use App\Models\Game;
use Illuminate\Database\Eloquent\Builder;

/**
 * Decides what reaches the calendar page.
 *
 * Separate from the quality gate on purpose. That one answers "is this worth
 * storing"; this answers "is this worth showing", and they are different
 * questions. Everything the four stores ship in a quarter is around 1,300
 * titles, and most of a month's four hundred are small PC releases nobody came
 * looking for.
 *
 * Nothing is deleted or hidden from anywhere else. An entry that fails this is
 * still in the database, still searchable, still has its own page. It simply
 * does not crowd the month.
 *
 * A title passes on **any one** of the tests, because each is a different kind
 * of evidence that somebody meant it — and requiring all of them would keep
 * only the handful of games that need no help being found.
 */
class CalendarVisibility
{
    /**
     * Narrow a query to what belongs on the calendar.
     *
     * Written as SQL rather than a collection filter because the month is
     * fetched by this and a filter would mean loading everything first.
     */
    public function apply(Builder $query): Builder
    {
        $rules = config('releases.calendar');

        return $query->where(function (Builder $q) use ($rules) {
            // On more than one platform: a publisher is behind it.
            $q->whereHas('storeLinks', function (Builder $links) {
                $links->whereNotNull('game_id');
            }, '>=', $rules['min_stores']);

            // Somebody cut a trailer, which asset flips do not do.
            $q->orWhereJsonLength('videos', '>', 0);

            // Our own visitors want it.
            $q->orWhereHas('userGames', function (Builder $wishlists) {
                $wishlists->where('status', 'wishlist');
            }, '>=', $rules['min_wishlists']);

            // Or it is simply a substantial listing: enough screenshots and
            // enough written about it that no shovelware bothers.
            $q->orWhere(function (Builder $substantial) use ($rules) {
                $substantial
                    ->whereJsonLength('screenshots', '>=', $rules['substantial']['screenshots'])
                    // A real column now, so one spelling works in both
                    // Postgres and the SQLite the tests run on.
                    ->whereRaw("length(coalesce(description, '')) >= ?", [$rules['substantial']['description']]);
            });
        });
    }

    /**
     * Why a given game does or does not appear, for the admin screen — the
     * rules are only defensible if an editor can see them applied.
     *
     * @return array<string,bool>
     */
    public function reasons(Game $game): array
    {
        $rules = config('releases.calendar');

        return [
            'on '.$rules['min_stores'].'+ platforms' => $game->storeLinks->whereNotNull('game_id')->count() >= $rules['min_stores'],
            'has a trailer' => count($game->videos ?? []) > 0,
            'wishlisted here' => $game->userGames()->where('status', 'wishlist')->count() >= $rules['min_wishlists'],
            'substantial listing' => count($game->screenshots ?? []) >= $rules['substantial']['screenshots']
                && mb_strlen((string) $game->description) >= $rules['substantial']['description'],
        ];
    }

    public function shows(Game $game): bool
    {
        return in_array(true, $this->reasons($game), true);
    }
}
