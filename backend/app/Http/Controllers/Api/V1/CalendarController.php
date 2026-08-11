<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\UserGame;
use App\Services\Releases\CalendarVisibility;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The release calendar.
 *
 * This used to call RAWG on every cache miss, which meant that when RAWG went
 * down — as it did — the calendar went down with it, and no amount of care on
 * our side could have prevented it. It now reads only what we already hold:
 * Steam, Xbox and the eShop are pulled in on a schedule, folded into single
 * entries, and stored. Nothing here goes over the network.
 *
 * The practical consequence is that this endpoint cannot fail for anyone else's
 * reasons. An empty month is now an empty month rather than an outage.
 */
class CalendarController extends Controller
{
    use ApiResponse;

    /** How a store is named on a release's page. */
    private const STORE_LABELS = [
        'steam' => 'Steam',
        'playstation' => 'PlayStation Store',
        'xbox' => 'Xbox',
        'nintendo' => 'Nintendo eShop',
    ];

    /**
     * How many of a day's releases travel with the month.
     *
     * August 2026 ships 1,133 games, and 196 of them land on one day. Sending
     * all of them made the response half a megabyte and the page an endless
     * scroll through shovelware. Each day now leads with its two biggest and
     * says how many more there are; `day()` serves the rest on request.
     */
    private const PREVIEW_PER_DAY = 2;

    /** The platform families the filter offers, and what our data calls them. */
    private const PLATFORM_FAMILIES = [
        'pc' => ['PC', 'Windows', 'Mac', 'Linux'],
        'playstation' => ['PlayStation'],
        'xbox' => ['Xbox'],
        'nintendo' => ['Nintendo', 'Switch'],
    ];

    /**
     * GET /calendar?month=YYYY-MM&platform=&genre=&sort=
     *
     * The whole page in one call: the month, its releases grouped by day, what
     * is biggest, the platform split, and — for a signed-in visitor — their own
     * watchlist.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
            'platform' => 'nullable|in:pc,playstation,xbox,nintendo',
            'genre' => 'nullable|string|max:40',
            'sort' => 'nullable|in:date,anticipated',
        ]);

        $month = $request->query('month')
            ? Carbon::createFromFormat('Y-m', $request->query('month'))->startOfMonth()
            : now()->startOfMonth();

        $releases = $this->monthReleases($month);

        $slugs = $releases->pluck('slug')->filter()->all();
        $wishlistCounts = $this->wishlistCounts($slugs);
        $mine = $this->myState($slugs);

        $decorated = $releases->map(fn (array $game) => array_merge($game, [
            'wishlists' => (int) ($wishlistCounts[$game['slug']] ?? 0),
            'wishlisted' => in_array($game['slug'], $mine['wishlisted'], true),
            'reminder' => in_array($game['slug'], $mine['reminders'], true),
        ]));

        $filtered = $this->applyFilters($decorated, $request);

        return $this->success([
            'month' => [
                'key' => $month->format('Y-m'),
                'label' => $month->format('F'),
                'year' => (int) $month->format('Y'),
                'previous' => $month->copy()->subMonth()->format('Y-m'),
                'next' => $month->copy()->addMonth()->format('Y-m'),
                'is_current' => $month->isSameMonth(now()),
            ],
            'stats' => [
                'releases' => $releases->count(),
                'wishlisted' => $decorated->where('wishlisted', true)->count(),
                'showing' => $filtered->count(),
            ],
            // The month's most notable release that actually brought art —
            // a hero slot with no image is a hero slot wasted.
            // A month that ships nothing has no hero, and that is an answer.
            'hero' => $this->forOutput(array_filter([
                $releases->filter(fn (array $g) => ! empty($g['cover_url']))->sortByDesc('added')->first()
                    ?? $releases->sortByDesc('added')->first(),
            ]))[0] ?? null,
            'most_anticipated' => $this->forOutput($decorated->sortByDesc('added')->take(5)),
            'days' => $this->groupByDay($filtered, $request->query('sort', 'date')),
            'upcoming' => $this->forOutput(
                $decorated->filter(fn (array $g) => $g['released'] && $g['released'] >= now()->toDateString())
                    ->sortBy('released')->take(5)
            ),
            'platform_breakdown' => $this->platformBreakdown($releases),
            'genres' => $this->genresIn($releases),
            'watchlist' => $this->watchlist(),
            'most_followed' => $this->beyondThisMonth($month),
        ]);
    }

    /**
     * GET /calendar/{slug} — one upcoming release, in full.
     *
     * Deliberately not the games database's page. That one is about a game
     * somebody has played: reviews, how long it takes, who else owns it. This
     * is about a game nobody has played yet, and everything on it comes from
     * what the stores said while announcing it — the art they chose, the
     * trailer they cut, where it will be sold and on what.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $game = Game::query()
            ->whereNotNull('match_key')
            ->where('slug', $slug)
            ->with('storeLinks')
            ->first();

        if (! $game) {
            return $this->error('That release is not in our calendar.', 404);
        }

        $mine = $this->myState([$slug]);
        $released = $game->released;

        return $this->success([
            'slug' => $game->slug,
            'name' => $game->name,
            'released' => $released?->toDateString(),
            'precision' => $game->release_precision,
            // Negative once it is out, which the page needs in order to stop
            // counting down and start saying it has landed.
            'days_away' => $released ? (int) now()->startOfDay()->diffInDays($released->copy()->startOfDay(), false) : null,
            'description' => $game->description,
            'publisher' => ($game->publishers ?? [])[0] ?? null,
            'developer' => ($game->developers ?? [])[0] ?? null,
            'cover_url' => $game->cover_url,
            'screenshots' => array_values($game->screenshots ?? []),
            'trailers' => array_values($game->videos ?? []),
            'genres' => array_values($game->genres ?? []),
            'platforms' => array_values($game->platforms ?? []),
            'notability' => (int) $game->hype_score,

            // The one thing this page has that no games database page does:
            // where the thing will actually be sold.
            'stores' => $game->storeLinks
                ->filter(fn ($link) => filled($link->url))
                ->map(fn ($link) => [
                    'store' => $link->store,
                    'label' => self::STORE_LABELS[$link->store] ?? ucfirst($link->store),
                    'url' => $link->url,
                ])
                ->values()
                ->all(),

            'wishlists' => (int) ($this->wishlistCounts([$slug])[$slug] ?? 0),
            'wishlisted' => in_array($slug, $mine['wishlisted'], true),
            'reminder' => in_array($slug, $mine['reminders'], true),

            'also_this_month' => $this->alsoThisMonth($game),
        ]);
    }

    /**
     * GET /calendar/day/{date} — everything landing on one day.
     *
     * The month sends each day's two biggest. This is what the rest of that
     * day looks like, asked for only when somebody wants it, and narrowed by
     * whatever filters the page is currently wearing.
     */
    public function day(Request $request, string $date): JsonResponse
    {
        $request->validate([
            'platform' => 'nullable|in:pc,playstation,xbox,nintendo',
            'genre' => 'nullable|string|max:40',
        ]);

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->error('That is not a date we can read.', 422);
        }

        $releases = app(CalendarVisibility::class)
            ->apply(
                Game::query()
                    ->whereNotNull('match_key')
                    ->whereDate('released', $date)
            )
            ->get()
            ->map(fn (Game $game) => $this->present($game));

        $slugs = $releases->pluck('slug')->filter()->all();
        $wishlistCounts = $this->wishlistCounts($slugs);
        $mine = $this->myState($slugs);

        $decorated = $releases->map(fn (array $game) => array_merge($game, [
            'wishlists' => (int) ($wishlistCounts[$game['slug']] ?? 0),
            'wishlisted' => in_array($game['slug'], $mine['wishlisted'], true),
            'reminder' => in_array($game['slug'], $mine['reminders'], true),
        ]));

        return $this->success([
            'date' => $date,
            'games' => $this->forOutput(
                $this->applyFilters($decorated, $request)->sortByDesc('added')
            ),
        ]);
    }

    /**
     * POST /calendar/{slug}/reminder — tell me when this lands.
     *
     * A reminder implies wanting the game, so it wishlists on the way in;
     * turning it off leaves the wishlist alone, because those are different
     * decisions.
     */
    public function toggleReminder(Request $request, string $slug): JsonResponse
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return $this->error('That game is not in our database yet — wishlist it from its page.', 404);
        }

        $entry = UserGame::firstOrNew([
            'user_id' => $request->user()->id,
            'game_id' => $game->id,
        ]);

        if (! $entry->exists) {
            $entry->status = 'wishlist';
        }

        $entry->notify_on_release = ! $entry->notify_on_release;
        $entry->save();

        return $this->success(
            ['reminder' => (bool) $entry->notify_on_release, 'wishlisted' => true],
            $entry->notify_on_release ? "We'll tell you when it lands." : 'Reminder off.'
        );
    }

    /* ── our own shelves ──────────────────────────────────────────────── */

    /**
     * Everything the aggregator holds for a month.
     *
     * match_key is what separates a calendar entry from the 200,000 historical
     * rows the games table also carries: only the aggregator sets it.
     *
     * @return Collection<int,array>
     */
    private function monthReleases(Carbon $month): Collection
    {
        // Nothing here depends on who is asking — wishlist counts and the
        // viewer's own state are decorated on afterwards — so a month is built
        // once and served to everyone until the aggregator moves.
        $rows = Cache::flexible('calendar.month.v1.'.$month->format('Y-m'), [300, 900], fn () => app(CalendarVisibility::class)
            ->apply(
                Game::query()
                    ->whereNotNull('match_key')
                    ->whereBetween('released', [
                        $month->copy()->startOfMonth()->toDateString(),
                        $month->copy()->endOfMonth()->toDateString(),
                    ])
            )
            ->orderBy('released')
            ->get()
            ->map(fn (Game $game) => $this->present($game))
            ->all());

        return collect($rows);
    }

    /** The month's biggest arrivals still ahead of it. */
    private function beyondThisMonth(Carbon $month): array
    {
        return app(CalendarVisibility::class)
            ->apply(
                Game::query()
                    ->whereNotNull('match_key')
                    ->where('released', '>', $month->copy()->endOfMonth()->toDateString())
            )
            ->orderByDesc('hype_score')
            ->limit(5)
            ->get()
            ->map(fn (Game $game) => $this->present($game))
            ->pipe(fn (Collection $games) => collect($this->forOutput($games)))
            ->all();
    }

    /**
     * What else lands the same month, for somebody who came in from a search
     * and has no idea what else is coming.
     */
    private function alsoThisMonth(Game $game): array
    {
        if (! $game->released) {
            return [];
        }

        return app(CalendarVisibility::class)
            ->apply(
                Game::query()
                    ->whereNotNull('match_key')
                    ->whereKeyNot($game->id)
                    ->whereBetween('released', [
                        $game->released->copy()->startOfMonth()->toDateString(),
                        $game->released->copy()->endOfMonth()->toDateString(),
                    ])
            )
            ->orderByDesc('hype_score')
            ->limit(6)
            ->get()
            ->map(fn (Game $other) => [
                'slug' => $other->slug,
                'name' => $other->name,
                'released' => $other->released?->toDateString(),
                'cover_url' => $other->cover_url,
                'platforms' => array_values($other->platforms ?? []),
            ])
            ->all();
    }

    private function present(Game $game): array
    {
        $platforms = collect($game->platforms ?? [])->filter()->values();

        return [
            'slug' => $game->slug,
            'name' => $game->name,
            'released' => $game->released?->toDateString(),
            'cover_url' => $game->cover_url,
            // Not a measure of anticipation — no store publishes one. See
            // Notability for what this actually counts.
            'added' => (int) $game->hype_score,
            'genres' => collect($game->genres ?? [])->filter()->take(2)->values()->all(),
            'platforms' => $platforms->take(4)->all(),
            'platform_slugs' => $platforms->all(),
            'publisher' => ($game->publishers ?? [])[0] ?? null,
        ];
    }

    /**
     * platform_slugs is how the filters and the breakdown match a family; the
     * page reads `platforms`. It stays out of the response.
     *
     * @param  Collection<int,array>|array<int,array>  $games
     */
    private function forOutput(Collection|array $games): array
    {
        return collect($games)->map(function (array $game) {
            unset($game['platform_slugs']);

            return $game;
        })->values()->all();
    }

    /* ── our own numbers ──────────────────────────────────────────────── */

    /** @return array<string,int> */
    private function wishlistCounts(array $slugs): array
    {
        if ($slugs === []) {
            return [];
        }

        return DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->whereIn('games.slug', $slugs)
            ->where('user_games.status', 'wishlist')
            ->selectRaw('games.slug, COUNT(*) as tally')
            ->groupBy('games.slug')
            ->pluck('tally', 'games.slug')
            ->all();
    }

    /** @return array{wishlisted:string[],reminders:string[]} */
    private function myState(array $slugs): array
    {
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user || $slugs === []) {
            return ['wishlisted' => [], 'reminders' => []];
        }

        $rows = DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereIn('games.slug', $slugs)
            ->get(['games.slug', 'user_games.status', 'user_games.notify_on_release']);

        return [
            'wishlisted' => $rows->where('status', 'wishlist')->pluck('slug')->all(),
            'reminders' => $rows->where('notify_on_release', true)->pluck('slug')->all(),
        ];
    }

    /** The viewer's own upcoming releases, wherever they sit in the year. */
    private function watchlist(): array
    {
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user) {
            return [];
        }

        return DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->whereIn('user_games.status', ['wishlist', 'backlog'])
            ->whereNotNull('games.released')
            ->where('games.released', '>=', now()->toDateString())
            ->orderBy('games.released')
            ->limit(6)
            ->get(['games.slug', 'games.name', 'games.cover_url', 'games.released', 'user_games.notify_on_release'])
            ->map(fn ($row) => [
                'slug' => $row->slug,
                'name' => $row->name,
                'cover_url' => $row->cover_url,
                'released' => Carbon::parse($row->released)->toDateString(),
                'reminder' => (bool) $row->notify_on_release,
            ])
            ->all();
    }

    /* ── shaping ──────────────────────────────────────────────────────── */

    private function applyFilters(Collection $games, Request $request): Collection
    {
        $platform = $request->query('platform');
        $genre = $request->query('genre');

        return $games
            ->when($platform, fn (Collection $c) => $c->filter(
                fn (array $g) => $this->inFamily($g['platform_slugs'], $platform)
            ))
            ->when($genre, fn (Collection $c) => $c->filter(
                fn (array $g) => in_array($genre, $g['genres'], true)
            ))
            ->values();
    }

    /**
     * Stores name their hardware differently — "Xbox Series X|S", "Nintendo
     * Switch 2" — so families are matched on the part that identifies the
     * maker rather than on an exact string.
     */
    private function inFamily(array $platforms, string $family): bool
    {
        foreach ($platforms as $platform) {
            foreach (self::PLATFORM_FAMILIES[$family] ?? [] as $needle) {
                if (str_contains($platform, $needle)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Releases grouped under the day they land on.
     *
     * `sort` used to be inert: the games were ordered by size, then grouped,
     * then re-sorted inside each day and the days re-sorted by date, so
     * /calendar and /calendar?sort=anticipated returned identical bytes.
     * "Biggest first" now orders the days themselves by their strongest
     * release, which is the only reading of the label that a calendar can
     * honour.
     */
    private function groupByDay(Collection $games, string $sort): array
    {
        $days = $games
            ->filter(fn (array $g) => $g['released'])
            ->groupBy('released')
            ->map(function (Collection $rows, string $date) {
                $ranked = $rows->sortByDesc('added')->values();

                return [
                    'date' => $date,
                    'day' => Carbon::parse($date)->format('d'),
                    'weekday' => Carbon::parse($date)->format('D'),
                    'month' => Carbon::parse($date)->format('M'),
                    'games' => $this->forOutput($ranked->take(self::PREVIEW_PER_DAY)),
                    'total' => $ranked->count(),
                ];
            });

        return ($sort === 'anticipated'
            ? $days->sortByDesc(fn (array $day) => $day['games'][0]['added'] ?? 0)
            : $days->sortBy('date')
        )->values()->all();
    }

    private function platformBreakdown(Collection $games): array
    {
        $tally = [];

        foreach ($games as $game) {
            foreach (array_keys(self::PLATFORM_FAMILIES) as $family) {
                if ($this->inFamily($game['platform_slugs'], $family)) {
                    $tally[$family] = ($tally[$family] ?? 0) + 1;
                }
            }
        }

        $total = max(1, array_sum($tally));
        $labels = ['pc' => 'PC', 'playstation' => 'PlayStation', 'xbox' => 'Xbox', 'nintendo' => 'Nintendo'];

        return collect($tally)
            ->map(fn (int $count, string $key) => [
                'key' => $key,
                'label' => $labels[$key] ?? $key,
                'count' => $count,
                'percent' => (int) round($count / $total * 100),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /** Only the genres this month actually ships, with counts. */
    private function genresIn(Collection $games): array
    {
        $tally = [];

        foreach ($games as $game) {
            foreach ($game['genres'] as $genre) {
                $tally[$genre] = ($tally[$genre] ?? 0) + 1;
            }
        }

        arsort($tally);

        return collect($tally)->take(8)->map(fn (int $count, string $name) => [
            'name' => $name,
            'count' => $count,
        ])->values()->all();
    }
}
