<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\UserGame;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * Everything the game database's front page needs that is not the game list
 * itself: the facets with their counts, what people are searching for, what
 * they are waiting on, and how big the thing actually is.
 *
 * Counts are the point. A filter that does not say how many games sit behind it
 * is asking the reader to guess, and with 200,000 rows the guesses are wrong.
 *
 * Every figure here is measured. Sections with nothing behind them yet — user
 * ratings, wishlists — return what they really have, which is usually zero, and
 * the page says so rather than inventing a number that would have to be walked
 * back later.
 */
class GameHubController extends Controller
{
    use ApiResponse;

    /** Facets are a full-table scan over array columns; they change slowly. */
    private const FACET_TTL = 21600;

    /** Platform families, so 337 raw platform strings become something usable. */
    private const FAMILIES = [
        'pc' => ['PC', 'Windows', 'Linux', 'macOS', 'Mac'],
        'playstation' => ['PlayStation'],
        'xbox' => ['Xbox'],
        'nintendo' => ['Nintendo', 'Switch', 'Game Boy', 'Wii', 'GameCube', 'NES', 'SNES'],
        'mobile' => ['iOS', 'Android'],
        'retro' => ['Atari', 'Amiga', 'Commodore', 'Sega', 'Genesis', 'Dreamcast', 'DOS'],
    ];

    public function index(): JsonResponse
    {
        return $this->success([
            'stats' => $this->stats(),
            'facets' => Cache::remember('games.hub.facets.v1', self::FACET_TTL, fn () => [
                'genres' => $this->genres(),
                'platforms' => $this->platformFamilies(),
                'eras' => $this->eras(),
                'status' => $this->releaseStatus(),
            ]),
            'trending_searches' => $this->trendingSearches(),
            'most_wishlisted' => $this->mostWishlisted(),
        ]);
    }

    /**
     * How big the database is. Published rather than estimated, because the
     * whole claim of this page is that it is a real catalogue.
     */
    private function stats(): array
    {
        return Cache::remember('games.hub.stats.v1', 3600, function () {
            $facets = Cache::get('games.hub.facets.v1');

            return [
                'games' => Game::count(),
                'rated' => Game::where('rating', '>', 0)->count(),
                'upcoming' => Game::whereNotNull('match_key')->count(),
                'genres' => $facets ? count($facets['genres']) : $this->distinct('genres'),
                'platforms' => $this->distinct('platforms'),
                'community_ratings' => GameRating::where('is_draft', false)->count(),
                'tracked' => UserGame::count(),
            ];
        });
    }

    private function distinct(string $column): int
    {
        return (int) (DB::selectOne(
            "select count(distinct v) as n from (select unnest({$column}) as v from games) t"
        )->n ?? 0);
    }

    /** @return array<int,array{name:string,count:int}> */
    private function genres(): array
    {
        return collect(DB::select(
            'select unnest(genres) as name, count(*) as tally
             from games group by 1 order by tally desc'
        ))->map(fn ($row) => ['name' => $row->name, 'count' => (int) $row->tally])->all();
    }

    /**
     * Platforms are stored as whatever each source called them, which is 337
     * distinct strings. Grouped into the families a reader would actually pick.
     *
     * @return array<int,array{key:string,label:string,count:int}>
     */
    private function platformFamilies(): array
    {
        $rows = DB::select(
            'select unnest(platforms) as name, count(*) as tally from games group by 1'
        );

        $labels = [
            'pc' => 'PC', 'playstation' => 'PlayStation', 'xbox' => 'Xbox',
            'nintendo' => 'Nintendo', 'mobile' => 'Mobile', 'retro' => 'Retro',
        ];

        $tally = array_fill_keys(array_keys(self::FAMILIES), 0);

        foreach ($rows as $row) {
            foreach (self::FAMILIES as $family => $needles) {
                foreach ($needles as $needle) {
                    if (str_contains($row->name, $needle)) {
                        $tally[$family] += (int) $row->tally;

                        continue 3;
                    }
                }
            }
        }

        return collect($tally)
            ->map(fn (int $count, string $key) => ['key' => $key, 'label' => $labels[$key], 'count' => $count])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /** @return array<int,array{key:string,label:string,from:int,to:int,count:int}> */
    private function eras(): array
    {
        $bands = [
            ['2020s', 2020, 2029], ['2010s', 2010, 2019], ['2000s', 2000, 2009],
            ['1990s', 1990, 1999], ['1980s', 1980, 1989], ['Earlier', 1950, 1979],
        ];

        return collect($bands)->map(fn (array $band) => [
            'key' => strtolower($band[0]),
            'label' => $band[0],
            'from' => $band[1],
            'to' => $band[2],
            'count' => Game::whereBetween('released', ["{$band[1]}-01-01", "{$band[2]}-12-31"])->count(),
        ])->all();
    }

    /** @return array<int,array{key:string,label:string,count:int}> */
    private function releaseStatus(): array
    {
        $today = now()->toDateString();

        return [
            ['key' => 'all', 'label' => 'All', 'count' => Game::count()],
            ['key' => 'released', 'label' => 'Released', 'count' => Game::where('released', '<=', $today)->count()],
            ['key' => 'upcoming', 'label' => 'Upcoming', 'count' => Game::where('released', '>', $today)->count()],
            ['key' => 'undated', 'label' => 'No date', 'count' => Game::whereNull('released')->count()],
        ];
    }

    /**
     * What people have actually typed into the search box.
     *
     * GameController has been recording this into a daily sorted set for some
     * time and nothing has ever read it. Thirty days of retention, so this is a
     * month's worth rather than today's.
     *
     * @return array<int,array{term:string,count:int}>
     */
    private function trendingSearches(): array
    {
        return Cache::remember('games.hub.trending.v1', 900, function () {
            try {
                $totals = [];

                foreach (range(0, 29) as $back) {
                    $key = 'analytics:game_search:'.now()->subDays($back)->format('Y-m-d');

                    foreach (Redis::zrevrange($key, 0, 40, ['withscores' => true]) as $term => $score) {
                        $totals[$term] = ($totals[$term] ?? 0) + (int) $score;
                    }
                }

                arsort($totals);

                return collect($totals)->take(8)
                    ->map(fn (int $count, string $term) => ['term' => $term, 'count' => $count])
                    ->values()->all();
            } catch (\Throwable) {
                // Analytics must never take the page down with it.
                return [];
            }
        });
    }

    /**
     * The games people here are waiting on. Small today, and shown as it is —
     * a made-up follower count would only have to be retracted later.
     *
     * @return array<int,array>
     */
    private function mostWishlisted(): array
    {
        return Cache::remember('games.hub.wishlisted.v1', 900, fn () => DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.status', 'wishlist')
            ->groupBy('games.id', 'games.slug', 'games.name', 'games.cover_url')
            ->orderByRaw('count(*) desc')
            ->limit(6)
            ->get([
                'games.slug', 'games.name', 'games.cover_url',
                DB::raw('count(*) as tally'),
            ])
            ->map(fn ($row) => [
                'slug' => $row->slug,
                'name' => $row->name,
                'cover_url' => $row->cover_url,
                'wishlists' => (int) $row->tally,
            ])
            ->all());
    }
}
