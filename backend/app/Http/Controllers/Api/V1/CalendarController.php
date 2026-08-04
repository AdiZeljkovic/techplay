<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\UserGame;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
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
            'hero' => $releases->sortByDesc('added')->first(),
            'most_anticipated' => $decorated->sortByDesc('added')->take(5)->values()->all(),
            'days' => $this->groupByDay($filtered, $request->query('sort', 'date')),
            'upcoming' => $decorated->filter(fn (array $g) => $g['released'] && $g['released'] >= now()->toDateString())
                ->sortBy('released')->take(5)->values()->all(),
            'platform_breakdown' => $this->platformBreakdown($releases),
            'genres' => $this->genresIn($releases),
            'watchlist' => $this->watchlist(),
            'most_followed' => $this->beyondThisMonth($month),
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
        return Game::query()
            ->whereNotNull('match_key')
            ->whereBetween('released', [
                $month->copy()->startOfMonth()->toDateString(),
                $month->copy()->endOfMonth()->toDateString(),
            ])
            ->orderBy('released')
            ->get()
            ->map(fn (Game $game) => $this->present($game));
    }

    /** The month's biggest arrivals still ahead of it. */
    private function beyondThisMonth(Carbon $month): array
    {
        return Game::query()
            ->whereNotNull('match_key')
            ->where('released', '>', $month->copy()->endOfMonth()->toDateString())
            ->orderByDesc('hype_score')
            ->limit(5)
            ->get()
            ->map(fn (Game $game) => $this->present($game))
            ->all();
    }

    private function present(Game $game): array
    {
        $platforms = collect($game->platform_names ?? [])->filter()->values();

        return [
            'slug' => $game->slug,
            'name' => $game->name,
            'released' => $game->released?->toDateString(),
            'tba' => $game->release_precision === 'tba',
            'precision' => $game->release_precision,
            'background_image' => $game->background_image,
            'metacritic' => $game->metacritic,
            'rating' => (float) ($game->rating ?? 0),
            // Not a measure of anticipation — no store publishes one. See
            // Notability for what this actually counts.
            'added' => (int) $game->hype_score,
            'genres' => collect($game->genre_names ?? [])->filter()->take(2)->values()->all(),
            'platforms' => $platforms->take(4)->all(),
            'platform_slugs' => $platforms->all(),
            'publisher' => data_get($game->details_data, 'publisher'),
        ];
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
            ->get(['games.slug', 'games.name', 'games.background_image', 'games.released', 'user_games.notify_on_release'])
            ->map(fn ($row) => [
                'slug' => $row->slug,
                'name' => $row->name,
                'background_image' => $row->background_image,
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

    /** Releases grouped under the day they land on, in calendar order. */
    private function groupByDay(Collection $games, string $sort): array
    {
        if ($sort === 'anticipated') {
            $games = $games->sortByDesc('added');
        }

        return $games
            ->filter(fn (array $g) => $g['released'])
            ->groupBy('released')
            ->map(fn (Collection $rows, string $date) => [
                'date' => $date,
                'day' => Carbon::parse($date)->format('d'),
                'weekday' => Carbon::parse($date)->format('D'),
                'month' => Carbon::parse($date)->format('M'),
                'games' => $rows->sortByDesc('added')->values()->all(),
            ])
            ->sortBy('date')
            ->values()
            ->all();
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
