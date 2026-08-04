<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\UserGame;
use App\Services\RawgService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The release calendar. RAWG is the only source for what is coming and when —
 * our database contributes nothing but the things RAWG cannot know: who here
 * wishlisted a game, and who asked to be told when it lands.
 */
class CalendarController extends Controller
{
    use ApiResponse;

    /**
     * RAWG pages per month, 40 games each. Three covers every month that ships
     * anything worth a calendar; going deeper only buys shovelware, and each
     * page is a round trip a cold visitor waits on.
     */
    private const PAGES = 3;

    /** How long a warm month is served before it is refetched. */
    private const FRESH_TTL = 21600; // 6h

    /**
     * How long the last good answer survives as a fallback. A month's releases
     * barely move, so week-old data beats an error page by a wide margin.
     */
    private const STALE_TTL = 604800; // 7d

    /** The platform families the filter offers, and what RAWG calls them. */
    private const PLATFORM_FAMILIES = [
        'pc' => ['pc'],
        'playstation' => ['playstation5', 'playstation4', 'playstation3', 'ps-vita', 'playstation2'],
        'xbox' => ['xbox-series-x', 'xbox-one', 'xbox360'],
        'nintendo' => ['nintendo-switch', 'nintendo-3ds', 'wii-u'],
    ];

    /** Short labels for the chips, so a card doesn't carry "PlayStation 5". */
    private const PLATFORM_SHORT = [
        'pc' => 'PC',
        'playstation5' => 'PS5',
        'playstation4' => 'PS4',
        'xbox-series-x' => 'Xbox',
        'xbox-one' => 'Xbox',
        'nintendo-switch' => 'Switch',
        'ios' => 'iOS',
        'android' => 'Android',
        'macos' => 'Mac',
        'linux' => 'Linux',
    ];

    /**
     * GET /calendar?month=YYYY-MM&platform=&genre=&sort=
     *
     * The whole page in one call: the month, its releases grouped by day,
     * what's most anticipated, the platform split, and — for a signed-in
     * visitor — their own watchlist.
     */
    public function index(Request $request, RawgService $rawg): JsonResponse
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

        $releases = $this->monthReleases($rawg, $month);

        if ($releases === null) {
            return $this->error('The release calendar is unavailable right now.', 503);
        }

        // Our own numbers, merged in by slug — RAWG has no idea who here
        // wants what.
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
            'most_followed' => $this->mostFollowed(),
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

    /* ── RAWG ─────────────────────────────────────────────────────────── */

    /**
     * A month, from cache if it is warm, from RAWG if it is not, and from the
     * last good answer if RAWG is down. Null only when we have never once
     * succeeded for this month.
     *
     * @return Collection<int,array>|null
     */
    public function monthReleases(RawgService $rawg, Carbon $month, bool $force = false): ?Collection
    {
        $from = $month->copy()->startOfMonth()->toDateString();
        $to = $month->copy()->endOfMonth()->toDateString();

        $fresh = "calendar.month.{$from}.v3";
        $stale = "calendar.month.{$from}.stale";

        if (! $force && ($hit = Cache::get($fresh)) !== null) {
            return collect($hit);
        }

        $data = $rawg->getReleases($from, $to, 'released', self::PAGES);

        if ($data === null) {
            // RAWG is unreachable. Last week's answer for this month is still
            // very nearly right — serve it rather than an error page.
            $fallback = Cache::get($stale);

            return $fallback === null ? null : collect($fallback);
        }

        $games = collect($data['results'] ?? [])
            ->map(fn (array $g) => $this->present($g))
            ->filter(fn (array $g) => $g['slug'] !== '' && $g['name'] !== '')
            ->values()
            ->all();

        Cache::put($fresh, $games, self::FRESH_TTL);
        Cache::put($stale, $games, self::STALE_TTL);

        return collect($games);
    }

    private function present(array $g): array
    {
        $platforms = collect($g['platforms'] ?? [])
            ->map(fn ($p) => $p['platform']['slug'] ?? null)
            ->filter()
            ->values();

        return [
            'slug' => $g['slug'] ?? '',
            'name' => $g['name'] ?? '',
            'released' => $g['released'] ?? null,
            'tba' => (bool) ($g['tba'] ?? false),
            'background_image' => $g['background_image'] ?? null,
            'metacritic' => $g['metacritic'] ?? null,
            'rating' => (float) ($g['rating'] ?? 0),
            // RAWG's "added to a library" figure — the only honest hype number
            // available before a game exists.
            'added' => (int) ($g['added'] ?? 0),
            'genres' => collect($g['genres'] ?? [])->pluck('name')->filter()->take(2)->values()->all(),
            'platforms' => $platforms->map(fn (string $slug) => self::PLATFORM_SHORT[$slug] ?? null)
                ->filter()->unique()->take(4)->values()->all(),
            'platform_slugs' => $platforms->all(),
            'publisher' => collect($g['publishers'] ?? [])->pluck('name')->first(),
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
                'released' => $row->released,
                'reminder' => (bool) $row->notify_on_release,
            ])
            ->all();
    }

    /**
     * The year's biggest arrivals by RAWG's added count — the calendar's
     * "everyone is waiting for this", not just this month's.
     *
     * A decorative rail is never worth a second RAWG round trip while someone
     * is waiting on the page, so the request path reads cache only. The warmer
     * fills it; until then the rail is simply absent.
     */
    private function mostFollowed(): array
    {
        return Cache::get('calendar.most_followed.v3', []);
    }

    /** Called by the warmer, off the request path. */
    public function warmMostFollowed(RawgService $rawg): int
    {
        $data = $rawg->getReleases(now()->toDateString(), now()->addMonths(18)->toDateString(), '-added', 1);

        if ($data === null) {
            return 0;
        }

        $games = collect($data['results'] ?? [])
            ->map(fn (array $g) => $this->present($g))
            ->sortByDesc('added')
            ->take(5)
            ->values()
            ->all();

        Cache::put('calendar.most_followed.v3', $games, self::STALE_TTL);

        return count($games);
    }

    /* ── shaping ──────────────────────────────────────────────────────── */

    private function applyFilters(Collection $games, Request $request): Collection
    {
        $platform = $request->query('platform');
        $genre = $request->query('genre');

        return $games
            ->when($platform, fn (Collection $c) => $c->filter(
                fn (array $g) => array_intersect($g['platform_slugs'], self::PLATFORM_FAMILIES[$platform] ?? [])
            ))
            ->when($genre, fn (Collection $c) => $c->filter(
                fn (array $g) => in_array($genre, $g['genres'], true)
            ))
            ->values();
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
                if (array_intersect($game['platform_slugs'], self::PLATFORM_FAMILIES[$family])) {
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
