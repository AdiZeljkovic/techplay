<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\SitemapController;
use App\Models\Article;
use App\Models\Game;
use App\Models\GameList;
use App\Models\GameRelation;
use App\Models\GameSeries;
use App\Services\CacheService;
use App\Services\Chronicle\TasteProfileService;
use App\Services\SanitizationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class GameController extends Controller
{
    /** Parse PostgreSQL TEXT[] string like `{Action,"Role-Playing (RPG)"}` into a PHP array. */
    private function pgArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || $value === '{}') {
            return [];
        }

        // PHP 8.4 changes str_getcsv()'s default $escape from "\\" to "", and warns
        // on every call that leaves it out. That warning arrives with a full stack
        // trace, and these two run on every game read — between 2,000 and 5,500
        // lines a day, into a laravel.log that had reached 1.9 GB.
        //
        // Passing the current default explicitly keeps today's parsing exactly as
        // it is: PostgreSQL escapes with a backslash inside quoted array elements,
        // so "" would be the wrong value here, not merely a different one.
        return str_getcsv(trim($value, '{}'), ',', '"', '\\');
    }

    /**
     * Related games, grouped under the words a page would use.
     *
     * `slug` is null for most of them and that is the normal case, not a gap:
     * DLC, mods and packs are not imported as pages, so the other side is a
     * name the page prints rather than a link it offers. The ones we do carry
     * come with everything needed to draw a card.
     *
     * @param  Collection<int, GameRelation>  $rows
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function relations($rows): array
    {
        $out = [];

        foreach ($rows as $row) {
            $label = GameRelation::label($row->relation);
            $other = $row->other;

            $out[$label][] = [
                'name' => $other?->name ?? $row->other_name,
                'slug' => $other?->slug,
                'cover_url' => $other?->cover_url,
                'released' => $other?->released?->format('Y-m-d'),
            ];
        }

        /* A game can hold a hundred DLC rows; the page shows a shelf, not a
           catalogue. The ones with a page of their own lead, since those are
           the ones a reader can do something with. */
        return array_map(function ($games) {
            usort($games, fn ($a, $b) => ($b['slug'] !== null) <=> ($a['slug'] !== null));

            return array_slice($games, 0, 24);
        }, $out);
    }

    /**
     * The covers for a list of games we hold only the name and slug of.
     *
     * `similar_games` is written at import time from IGDB's own list, and a
     * cover stored then would be a copy that goes stale. One query on the way
     * out, behind the ten-minute page cache, keeps it current — and without it
     * the shelf draws a row of empty black cards, which is worse than the row
     * of text chips it replaced.
     *
     * @param  array<int, array{name: string, slug: string}>  $games
     * @return array<int, array<string, mixed>>
     */
    private function withCovers(array $games): array
    {
        if ($games === []) {
            return [];
        }

        $covers = Game::whereIn('slug', array_column($games, 'slug'))->pluck('cover_url', 'slug');

        return array_map(fn ($game) => $game + ['cover_url' => $covers[$game['slug']] ?? null], $games);
    }

    /**
     * A keyed map that stays a map when it is empty.
     *
     * PHP's empty array encodes as `[]`, so a field that is an object on every
     * game with relations became an array on every game without — the shape of
     * the field depending on whether there was anything to put in it. Clients
     * should not have to handle both.
     */
    private function keyed(array $map): object
    {
        return (object) $map;
    }

    /**
     * IGDB's seconds as hours, rounded the way a person would say them.
     *
     * `count` comes along because "24 hours, from 3 people" and "24 hours, from
     * 4,000" are not the same claim, and the page can say so.
     *
     * @return array{hastily?: int, normally?: int, completely?: int, count: int}|null
     */
    private function hours(mixed $seconds): ?array
    {
        if (! is_array($seconds) || $seconds === []) {
            return null;
        }

        $out = [];

        foreach (['hastily', 'normally', 'completely'] as $pace) {
            if (! empty($seconds[$pace])) {
                $out[$pace] = max(1, (int) round(((int) $seconds[$pace]) / 3600));
            }
        }

        return $out === [] ? null : $out + ['count' => (int) ($seconds['count'] ?? 0)];
    }

    /**
     * A random game with a real description — powers the "Random Game" button.
     * Random offset instead of ORDER BY random() so it stays fast on 200K rows.
     */
    public function random()
    {
        $count = Cache::remember('games.random_count', 3600, fn () => Game::whereNotNull('description')->count());

        if ($count < 1) {
            return response()->json(['message' => 'No games available'], 404);
        }

        $game = Game::whereNotNull('description')
            ->orderBy('id')
            ->offset(random_int(0, $count - 1))
            ->limit(1)
            ->first(['slug', 'name']);

        return response()->json($game);
    }

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $genre = $request->input('genres', '');       // text name e.g. "Action"
        $platform = $request->input('platforms', '');    // text name e.g. "PC"
        $tag = $request->input('tags', '');           // text name e.g. "Open World"
        $ordering = $request->input('ordering', '-rating');
        $yearFrom = (int) $request->input('year_from', 0);
        $yearTo = (int) $request->input('year_to', 0);
        $minRating = (float) $request->input('min_rating', 0);
        // released | upcoming | undated — the hub's rail offers these with
        // counts, so the list has to be able to answer them.
        $status = $request->input('status', 'all');
        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(40, max(10, (int) $request->input('page_size', 20)));

        /*
         * The series filter takes the slug, not the key.
         *
         * `series_key` is a bare integer with no meaning to a reader, and the
         * page that uses this filter is /games/series/{slug} — so the slug is
         * what travels. An unknown slug resolves to null and the filter is not
         * applied; the route above it answers 404 before that can happen, and a
         * stray ?series=nonsense on /games should not empty the catalogue.
         */
        $seriesSlug = (string) $request->input('series', '');
        $seriesKey = $seriesSlug !== ''
            ? GameSeries::where('slug', $seriesSlug)->value('series_key')
            : null;

        $cacheKey = 'games.index.v3.'.md5(json_encode([
            $search, $genre, $platform, $tag, $ordering, $yearFrom, $yearTo, $minRating, $status, $page, $pageSize, $seriesKey,
        ]));

        $payload = Cache::remember($cacheKey, 300, function () use ($search, $genre, $platform, $tag, $ordering, $yearFrom, $yearTo, $minRating, $status, $page, $pageSize, $seriesKey, $request) {
            $today = now()->toDateString();
            $q = Game::query()
                ->when($search, fn ($q) => $q->where('name', 'ilike', "%{$search}%"))
                ->when($genre, fn ($q) => $q->whereRaw('genres @> ARRAY[?]::text[]', [$genre]))
                ->when($platform, fn ($q) => $q->whereRaw('platforms @> ARRAY[?]::text[]', [$platform]))
                ->when($tag, fn ($q) => $q->whereRaw('tags @> ARRAY[?]::text[]', [$tag]))
                ->when($seriesKey !== null, fn ($q) => $q->where('series_key', $seriesKey))
                ->when($yearFrom > 0, fn ($q) => $q->where('released', '>=', "{$yearFrom}-01-01"))
                ->when($yearTo > 0, fn ($q) => $q->where('released', '<=', "{$yearTo}-12-31"))
                ->when($minRating > 0, fn ($q) => $q->where('rating', '>=', $minRating))
                ->when($status === 'released', fn ($q) => $q->where('released', '<=', $today))
                ->when($status === 'upcoming', fn ($q) => $q->where('released', '>', $today))
                ->when($status === 'undated', fn ($q) => $q->whereNull('released'))
                ->select(['id', 'slug', 'name', 'released', 'rating', 'cover_url', 'platforms', 'genres']);

            // The game itself before its editions: a search for "Half-Life 2"
            // should lead with the game, not sixteen compilations of it.
            // Within an explicit Compilation/Add-on filter every row carries
            // the same penalty, so this changes nothing there. (Postgres
            // array-overlap; the sqlite test database skips the demote.)
            if (DB::getDriverName() === 'pgsql') {
                $q->orderByRaw("(genres && ARRAY['Add-on','Compilation','Special edition']::text[])::int asc");
            }

            // Ordering. DESC on Postgres puts NULLs first, which led every
            // "Top Rated" list with unrated games — hence the explicit
            // NULLS LAST (modern SQLite accepts the same spelling).
            match ($ordering) {
                'rating' => $q->orderBy('rating'),
                '-released' => $q->orderByRaw('released DESC NULLS LAST'),
                'released' => $q->orderBy('released'),
                'name' => $q->orderBy('name'),
                '-name' => $q->orderByDesc('name'),
                '-views' => $q->orderByDesc('views'),  // trending by real page views
                '-added' => $q->orderByDesc('id'),     // recently added to the database
                // What people are actually playing and looking up, from IGDB's
                // popularity primitives — 125,237 games carry one. NULLS LAST
                // for the rest, same as rating above and for the same reason.
                //
                // Broken by our own page views, because a percentile of 100
                // means "top half a percent of its measure" and around two
                // hundred games sit there. Without a second key their order is
                // whatever the planner felt like, and it would change between
                // requests on the most visible page of the section.
                '-popularity' => $q->orderByRaw('popularity DESC NULLS LAST')->orderByDesc('views')->orderBy('id'),
                default => $q->orderByRaw('rating DESC NULLS LAST'),  // -rating (default)
            };

            $games = $q->paginate($pageSize, ['*'], 'page', $page);

            return [
                'count' => $games->total(),
                'next' => $games->hasMorePages() ? $request->fullUrlWithQuery(['page' => $page + 1]) : null,
                'previous' => $page > 1 ? $request->fullUrlWithQuery(['page' => $page - 1]) : null,
                'results' => $games->items(),
            ];
        });

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    public function show(Request $request, string $slug)
    {
        $payload = Cache::remember(CacheService::gameShowKey($slug), 600, fn () => $this->buildShowPayload($slug));

        if (! $payload) {
            // Deleted on purpose (adult purge) answers 410, so crawlers drop
            // the page quickly instead of retrying a 404 for months.
            $gone = DB::table('game_tombstones')->where('slug', $slug)->exists();

            return response()->json(
                ['message' => $gone ? 'Game removed' : 'Game not found'],
                $gone ? 410 : 404
            );
        }

        $this->trackView((int) $payload['id'], $request->ip());

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    /**
     * Public, non-empty lists that hold this game — a few of them, and a total.
     *
     * Ordered by likes: on a game with a hundred lists behind it the three
     * worth showing are the ones people agreed with, not the newest three.
     */
    private function listsContaining(Game $game): array
    {
        $base = GameList::query()
            ->where('is_public', true)
            ->where('is_draft', false)
            ->whereHas('items', fn ($q) => $q->where('game_id', $game->id));

        $total = (clone $base)->count();

        if ($total === 0) {
            return ['total' => 0, 'items' => []];
        }

        $lists = $base
            ->withCount(['likes', 'items'])
            ->with('user:id,username,display_name')
            ->orderByDesc('likes_count')
            ->orderByDesc('updated_at')
            ->limit(3)
            ->get();

        return [
            'total' => $total,
            'items' => $lists->map(fn (GameList $l) => [
                'name' => $l->name,
                'slug' => $l->slug,
                'list_type' => $l->list_type,
                'items_count' => $l->items_count,
                'likes_count' => $l->likes_count,
                'username' => $l->user?->username,
                'display_name' => $l->user?->display_name,
            ])->all(),
        ];
    }

    /**
     * Buffer game page views in Redis (flushed to views by
     * FlushViewCounters), throttled to one count per IP per 30 minutes.
     */
    private function trackView(int $gameId, ?string $ip): void
    {
        try {
            $throttleKey = "game_view_{$gameId}_".md5((string) $ip);
            if (! Cache::has($throttleKey)) {
                Cache::put($throttleKey, 1, 1800);
                Redis::incr("views:game:{$gameId}");
            }
        } catch (\Throwable) {
            // View tracking must never break the page
        }
    }

    /**
     * The canonical detail payload. Real columns first; the import payload is
     * consulted only for what has not been promoted yet (vote counts, the
     * attribute list). No RAWG cosplay fields — a client that wants a value we
     * do not have should see it missing, not null-with-a-familiar-name.
     */
    private function buildShowPayload(string $slug): ?array
    {
        $game = Game::where('slug', $slug)
            ->with([
                'studios:id,name,slug,logo_url,games_count',
                'links:id,game_id,kind,service,url',
                'relations.other:id,name,slug,cover_url,released',
            ])
            // One subquery here saves the page two client requests per render.
            ->withCount('threads')
            ->first();

        if (! $game) {
            return null;
        }

        $esrb = collect($game->age_ratings ?? [])
            ->first(fn ($r) => ($r['rating_system_name'] ?? '') === 'ESRB Rating');

        return [
            'id' => $game->id,
            'name' => $game->name,
            'slug' => $game->slug,
            // Third-party HTML — the catalogue's, not ours — going straight
            // into dangerouslySetInnerHTML on every game page. Purified on the
            // way out rather than at ingest so the 140k rows already in the
            // table are covered too, not just the next import.
            'description' => $game->description
                ? app(SanitizationService::class)->sanitizeRichContent($game->description)
                : null,
            'released' => $game->released?->format('Y-m-d'),
            'release_precision' => $game->release_precision,
            'cover_url' => $game->cover_url,
            'website' => $game->website,
            'rating' => $game->rating,
            'rating_top' => 10,
            'ratings_count' => (int) $game->ratings_count,
            /*
             * So the page can decide not to ask.
             *
             * The game page fires two client calls on every render — one for
             * forum threads, one for ratings — and in nine days Googlebot made
             * 37,275 of them while rendering. 99% came back empty, because
             * almost no game in a catalogue of 332,455 has either. That was 55%
             * of everything Google spent on this site.
             *
             * A count in the payload the page already fetches costs one
             * subquery and lets the client skip a request that has nothing to
             * return.
             */
            'threads_count' => (int) ($game->threads_count ?? 0),
            'esrb_rating' => $esrb ? ['name' => $esrb['rating_name']] : null,
            'age_ratings' => $game->age_ratings ?? [],
            'attributes' => $game->attributes ?? [],
            'alt_titles' => $game->alt_titles ?? [],
            'platforms' => $game->platforms ?? [],
            'genres' => $game->genres ?? [],
            'tags' => $game->tags ?? [],
            'developers' => $game->developers ?? [],
            'publishers' => $game->publishers ?? [],

            /* The same credits as somewhere to go. The two arrays above stay:
               they cover games we never matched to IGDB, and they are what the
               page prints when a studio has no row of its own. */
            'studios' => $game->studios->map(fn ($studio) => [
                'name' => $studio->name,
                'slug' => $studio->slug,
                'logo_url' => $studio->logo_url,
                'games_count' => $studio->games_count,
                'role' => $studio->pivot->role,
            ])->values()->all(),
            'series_key' => $game->series_key,
            'series_name' => $game->series_name,
            /* The series as somewhere to go. The name was printed as plain
               text and the rail below it stopped at six games, so a reader on
               entry four of a fourteen-game series had no way to see the rest.
               Null when the series has no row yet — a fresh import before
               games:sync-series runs — and the page prints the name flat, as
               it did before. */
            'series_slug' => $game->series_key
                ? GameSeries::where('series_key', $game->series_key)->value('slug')
                : null,
            'videos' => $game->videos ?? [],
            'box_art' => $game->box_art ?? [],
            'critic_scores' => $game->critic_scores,
            'techplay_score' => $this->techplayScore($game),
            'screenshots_count' => count(array_is_list($game->screenshots ?? [])
                ? ($game->screenshots ?? [])
                : (($game->screenshots ?? [])['screenshots'] ?? ($game->screenshots ?? [])['results'] ?? [])),
            'views' => (int) $game->views,

            /* Member lists this game appears in.
               A game page is the busiest surface on the site — 332,455 of them —
               and until now none of them mentioned that somebody had put this
               game in a ranking. The lists were unreachable from anywhere; this
               is the widest door there is to them. */
            'in_lists' => $this->listsContaining($game),

            /* Where this game stands, and by which measure — a percentile with
               no name beside it is a number nobody can check. Null for the 62%
               of the catalogue IGDB has no reading for, and the page says
               nothing rather than guessing.
               The column holds basis points so the ordering has something to
               work with; 9,984 is not a thing to print beside a game, so what
               goes out is the percentile it means. */
            'popularity' => $game->popularity === null ? null : [
                'percentile' => (int) round(((int) $game->popularity) / 100),
                'metric' => $game->popularity_metric,
            ],

            /* What the rewritten page draws. Hours rather than the seconds the
               column holds — the precision is worth keeping in the database and
               worth losing on the page, where "about 24 hours" is the answer
               and "86,400 seconds" is a puzzle. */
            'time_to_beat' => $this->hours($game->time_to_beat),
            'game_modes' => $this->pgArray($game->game_modes),
            'player_perspectives' => $this->pgArray($game->player_perspectives),
            'multiplayer' => $game->multiplayer ?: null,
            'languages' => $game->languages ?? [],
            'artworks' => $game->artworks ?? [],
            'similar_games' => $this->withCovers($game->similar_games ?? []),
            'engines' => $this->pgArray($game->engines),

            /* Grouped by what the link is for, because "where to buy it" and
               "where its people are" are two different rows on the page. */
            'links' => $this->keyed($game->links
                ->groupBy('kind')
                ->map(fn ($group) => $group->map(fn ($link) => [
                    'service' => $link->service,
                    'url' => $link->url,
                ])->values()->all())
                ->all()),

            /* Both directions in one list, grouped under the words a page uses:
               a DLC page names its game, and the game's page names its DLC. */
            'related' => $this->keyed($this->relations($game->relations)),
        ];
    }

    /**
     * The TechPlay score, same blend the ratings endpoint serves: our own
     * editorial review (60%) against the community stars (40%), each alone
     * when the other is missing. Computed, never stored — a stored copy
     * would only ever be stale.
     */
    private function techplayScore(Game $game): ?float
    {
        $editorial = Article::where('game_id', $game->id)
            ->where('status', 'published')
            ->whereNotNull('review_score')
            ->orderByDesc('published_at')
            ->value('review_score');
        $editorial = $editorial !== null ? (float) $editorial : null;

        $stars = DB::table('game_ratings')->where('game_slug', $game->slug)->avg('rating');
        $community = $stars !== null ? round(((float) $stars) * 2, 1) : null;

        return match (true) {
            $editorial !== null && $community !== null => round(0.6 * $editorial + 0.4 * $community, 1),
            $editorial !== null => round($editorial, 1),
            $community !== null => $community,
            default => null,
        };
    }

    /**
     * GET /games/{slug}/bundle — everything one game page needs, in one call.
     *
     * The page was making five requests per render: the game, its screenshots,
     * its series, its suggestions and its related articles. The API meters at
     * sixty requests a minute keyed on the caller's IP, and every server render
     * leaves from one address — so twelve game views a minute exhausted the
     * budget and the thirteenth got a 429 that the render turned into a 500.
     * Measured against production: five of twelve pages failed at a pace of
     * fifteen requests a minute, sixty-three of seventy-five at full speed.
     *
     * A crawler does not browse at twelve pages a minute, and there are 114,000
     * of these. This is the difference between a catalogue that can be indexed
     * and one that cannot.
     *
     * The four separate endpoints stay: they are used elsewhere, and one of
     * them personalises on the signed-in reader, which this deliberately does
     * not — the bundle exists to be cached and shared, so it answers the same
     * way for everybody.
     */
    public function bundle(Request $request, string $slug)
    {
        $game = $this->show($request, $slug);

        // Not found or gone: hand the caller the same status rather than an
        // envelope wrapped around an error.
        if ($game->getStatusCode() !== 200) {
            return $game;
        }

        $decode = function ($response, string $key, $fallback) {
            $data = json_decode($response->getContent(), true);

            return $data[$key] ?? $fallback;
        };

        return response()->json([
            'game' => json_decode($game->getContent(), true),
            'screenshots' => $decode($this->screenshots($slug), 'results', []),
            'series' => $decode($this->series($slug), 'results', []),
            'suggested' => $decode($this->suggested($slug), 'results', []),
            'articles' => $decode($this->articles($slug), 'data', []),
        ])->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    public function articles(string $slug)
    {
        $gameId = Game::where('slug', $slug)->value('id');

        if (! $gameId) {
            return response()->json(['data' => []]);
        }

        $articles = Cache::remember("games.articles.v2.{$gameId}", 600, function () use ($gameId) {
            $articles = Article::where('game_id', $gameId)
                ->where('status', 'published')
                ->with('category:id,name,type')
                ->orderByDesc('published_at')
                ->limit(6)
                ->get(['id', 'slug', 'title', 'excerpt', 'featured_image_url', 'published_at', 'review_score', 'category_id'])
                ->map(fn ($a) => [
                    'slug' => $a->slug,
                    'title' => $a->title,
                    'excerpt' => $a->excerpt,
                    'image' => $a->featured_image_url,
                    'published_at' => $a->published_at?->toIso8601String(),
                    'review_score' => $a->review_score,
                    'category' => $a->category->name ?? null,
                    'path' => SitemapController::getArticleTypePath($a->category->type ?? 'news'),
                ]);

            // Guides ride the same spine: everything written about the game,
            // one list, told apart by the path it links to.
            $guides = DB::table('guides')
                ->where('game_id', $gameId)
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->limit(4)
                ->get(['slug', 'title', 'excerpt', 'featured_image_url', 'published_at'])
                ->map(fn ($g) => [
                    'slug' => $g->slug,
                    'title' => $g->title,
                    'excerpt' => $g->excerpt,
                    'image' => $g->featured_image_url,
                    'published_at' => $g->published_at,
                    'review_score' => null,
                    'category' => 'Guide',
                    'path' => 'guides',
                ]);

            return $articles->concat($guides)->sortByDesc('published_at')->values();
        });

        return response()->json(['data' => $articles])
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    public function screenshots(string $slug)
    {
        $data = Game::where('slug', $slug)->value('screenshots');
        $data = is_string($data) ? json_decode($data, true) : $data;

        // Moby wrapped its list; the aggregator writes a plain array of URLs.
        $results = array_is_list($data ?? [])
            ? ($data ?? [])
            : ($data['screenshots'] ?? $data['results'] ?? []);

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    public function videos(string $slug)
    {
        $data = Game::where('slug', $slug)->value('videos');
        $data = is_string($data) ? json_decode($data, true) : $data;
        $results = is_array($data) ? array_values($data) : [];

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    /**
     * Games in the same series. The old endpoint replayed a Moby payload blob;
     * this one asks our own catalogue, which is the point of having one.
     */
    public function series(string $slug)
    {
        $game = Game::where('slug', $slug)->first(['id', 'series_key']);

        if (! $game || ! $game->series_key) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        $results = Game::where('series_key', $game->series_key)
            ->where('id', '!=', $game->id)
            ->orderByDesc('rating')
            ->limit(10)
            ->get(['slug', 'name', 'released', 'rating', 'cover_url'])
            ->map(fn ($g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'released' => $g->released?->toDateString(),
                'rating' => (float) $g->rating,
                'cover_url' => $g->cover_url,
            ]);

        return response()->json(['count' => $results->count(), 'results' => $results]);
    }

    /**
     * The series itself, by slug.
     *
     * `series()` above answers "what else is in this game's series" for a game
     * page. This one answers "what is this series", which is what
     * /games/series/{slug} is, and carries the counts and the year span the
     * page states in prose and in its VideoGameSeries block.
     */
    public function seriesShow(string $slug)
    {
        $series = GameSeries::where('slug', $slug)->first();

        if (! $series) {
            return response()->json(['message' => 'Series not found'], 404);
        }

        // Cheap, and it keeps the page honest: platforms and genres are read
        // off the member games rather than stored on the series, where they
        // would go stale the moment a new entry lands.
        $facets = Cache::remember('series.facets.'.$series->series_key, 3600, function () use ($series) {
            $games = Game::where('series_key', $series->series_key)
                ->get(['platforms', 'genres']);

            $flatten = function (string $field) use ($games) {
                $all = [];
                foreach ($games as $game) {
                    foreach (($game->{$field} ?? []) as $value) {
                        $all[$value] = ($all[$value] ?? 0) + 1;
                    }
                }
                arsort($all);

                return array_slice(array_keys($all), 0, 8);
            };

            return ['platforms' => $flatten('platforms'), 'genres' => $flatten('genres')];
        });

        return response()->json([
            'slug' => $series->slug,
            'name' => $series->name,
            'games_count' => $series->games_count,
            'first_year' => $series->first_year,
            'last_year' => $series->last_year,
            'described_count' => $series->described_count,
            'platforms' => $facets['platforms'],
            'genres' => $facets['genres'],
        ]);
    }

    /**
     * More like this: same lead genre, well rated, with art. Honest and
     * simple — a recommender can replace the ranking later without the
     * endpoint changing shape.
     */
    public function suggested(string $slug)
    {
        // A signed-in player with a chronicle gets the list re-ranked by
        // their own taste; guests keep the shared genre list below.
        $user = request()->user('sanctum');
        if ($user) {
            $taste = app(TasteProfileService::class);
            if ($taste->isPersonalisable($user)) {
                return $this->suggestedFor($user, $slug, $taste);
            }
        }

        $game = Game::where('slug', $slug)->first(['id', 'genres']);
        $lead = $game?->genres[0] ?? null;

        if (! $game || ! $lead) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        $results = Cache::remember("games.suggested.v2.{$game->id}", 3600, fn () => Game::query()
            ->whereRaw('genres @> ARRAY[?]::text[]', [$lead])
            ->where('id', '!=', $game->id)
            ->whereNotNull('cover_url')
            ->where('rating', '>=', 7)
            ->orderByDesc('rating')
            ->limit(8)
            ->get(['slug', 'name', 'released', 'rating', 'cover_url'])
            ->map(fn ($g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'released' => $g->released?->toDateString(),
                'rating' => (float) $g->rating,
                'cover_url' => $g->cover_url,
            ])->all());

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    /** The personalised half of suggested(): same shape, their taste. */
    private function suggestedFor($user, string $slug, TasteProfileService $taste)
    {
        $game = Game::where('slug', $slug)->first(['id', 'genres']);
        if (! $game) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        $results = Cache::remember("games.suggested.me.{$user->id}.{$game->id}", 1800, function () use ($user, $game, $taste) {
            $weights = $taste->genreWeights($user);
            $negative = $taste->negativeGenres($user);
            $owned = DB::table('user_games')
                ->where('user_id', $user->id)->pluck('game_id')->all();

            $pool = ((array) $game->genres) !== []
                ? array_slice(array_unique(array_merge((array) $game->genres, array_keys($weights))), 0, 6)
                : array_keys($weights);

            if ($pool === []) {
                return [];
            }

            $placeholders = implode(',', array_fill(0, count($pool), '?'));

            return Game::query()
                ->whereRaw("genres && ARRAY[{$placeholders}]::text[]", $pool)
                ->where('id', '!=', $game->id)
                ->when($owned !== [], fn ($q) => $q->whereNotIn('id', $owned))
                ->whereNotNull('cover_url')
                ->where('rating', '>=', 6.5)
                ->orderByDesc('rating')
                ->limit(60)
                ->get(['slug', 'name', 'released', 'rating', 'cover_url', 'genres'])
                ->map(function (Game $g) use ($weights, $negative) {
                    $fit = 0.0;
                    foreach ((array) $g->genres as $genre) {
                        $fit += (float) ($weights[$genre] ?? 0) - 0.5 * (float) ($negative[$genre] ?? 0);
                    }

                    return ['fit' => $fit + ((float) $g->rating) / 20, 'game' => $g];
                })
                ->sortByDesc('fit')
                ->take(8)
                ->map(fn ($row) => [
                    'slug' => $row['game']->slug,
                    'name' => $row['game']->name,
                    'released' => $row['game']->released?->toDateString(),
                    'rating' => (float) $row['game']->rating,
                    'cover_url' => $row['game']->cover_url,
                ])
                ->values()
                ->all();
        });

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    /**
     * GET /games/hidden-gems — highly rated games almost nobody has voted on.
     *
     * "Hidden" = a trustworthy score (rating >= 8) from a small crowd
     * (3-80 votes). Candidates are pulled off the rating index and only then
     * have their vote count extracted, so this never scans the whole catalog.
     * The daily cache key doubles as the rotation seed.
     */
    public function hiddenGems()
    {
        $today = now()->toDateString();

        // v3: the payload grew an excerpt. A cached answer outlives a deploy
        // by up to a day, so a shape change has to change the key with it —
        // otherwise the new code serves yesterday's fields.
        $payload = Cache::remember("games.hidden_gems.v3.{$today}", 86400, function () use ($today) {
            $votes = 'ratings_count';

            return Game::query()
                ->whereNotNull('description')
                ->whereNotNull('cover_url')
                ->whereNotNull('released')
                ->where('rating', '>=', 8)
                ->orderByDesc('rating')
                ->limit(800)
                ->get(['slug', 'name', 'cover_url', 'rating', 'released', 'genres', 'description', DB::raw("{$votes} as votes")])
                // enough votes to trust the score, then the least-known first
                ->filter(fn ($g) => $g->votes !== null && $g->votes >= 3)
                ->sortBy('votes')
                ->take(60)
                // deterministic per-day shuffle so the rail rotates without a random seed
                ->sortBy(fn ($g) => md5($g->slug.$today))
                ->take(6)
                ->map(fn ($g) => [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'cover_url' => $g->cover_url,
                    'rating' => (float) $g->rating,
                    'released' => $g->released?->toDateString(),
                    'genres' => array_slice((array) $g->genres, 0, 2),
                    'votes' => (int) $g->votes,
                    // A line about the game. The card carried a name, a year
                    // and a score and stopped there, which left the panel
                    // short next to the anniversaries beside it — and left the
                    // reader with no reason to click a game they have, by
                    // definition, never heard of.
                    'excerpt' => $this->firstSentences($g->description),
                ])
                ->values()
                ->all();
        });

        return response()->json(['results' => $payload])
            // A minute in the browser, an hour at the edge — the same window
            // the anniversaries panel uses, and for the same reason: this
            // rotates once a day and an hour of browser cache only means a
            // returning reader cannot see that it has.
            ->header('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
    }

    /**
     * The opening of a game's description, ended like a sentence.
     *
     * A third of the catalogue's descriptions carry HTML and they average 642
     * characters, so this strips the markup, collapses the whitespace and cuts
     * at a word boundary rather than mid-word. The card clamps to two lines;
     * this only has to be short enough not to ship a paragraph over the wire.
     */
    private function firstSentences(?string $description, int $limit = 140): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $description)));

        if ($text === '') {
            return '';
        }

        if (mb_strlen($text) <= $limit) {
            return $text;
        }

        $cut = mb_substr($text, 0, $limit);
        $lastSpace = mb_strrpos($cut, ' ');

        if ($lastSpace !== false && $lastSpace > $limit * 0.6) {
            $cut = mb_substr($cut, 0, $lastSpace);
        }

        return rtrim($cut, ' ,;:-–—').'…';
    }

    /**
     * Gaming history for today, and for tomorrow.
     *
     * The panel drew four games and left half its box empty, which was the
     * limit and not the material: on 26 August, 51 games in the catalogue
     * clear the bar, and 41 do on the 27th. So it carries both days now — what
     * launched on this date in earlier years, and what launched on tomorrow's.
     *
     * Within each day the best-rated are chosen and then ordered by year,
     * because the panel draws a timeline and a timeline that runs 2013, 2014,
     * 2021, 2012 reads as a fault rather than as a sequence.
     */
    public function onThisDay()
    {
        $today = now();
        $tomorrow = $today->copy()->addDay();

        return response()->json([
            'date' => $today->format('F j'),
            // Kept as `results` rather than nested under `today`: this is the
            // shape the panel and its tests already read.
            'results' => $this->anniversaries($today, 5),
            'tomorrow' => [
                'date' => $tomorrow->format('F j'),
                'results' => $this->anniversaries($tomorrow, 4),
            ],
        ])
            /*
             * A minute in the browser, an hour at the edge.
             *
             * This said `max-age=3600` for both, and Cloudflare does not cache
             * it at all (`cf-cache-status: DYNAMIC`) — so the only thing the
             * hour bought was a returning reader holding yesterday's answer
             * for an hour, with no way to ask for a new one short of a hard
             * refresh. That is what happened the day this panel changed: the
             * new markup arrived, the old JSON stayed, and the two days ran
             * together as one unsorted list.
             *
             * `s-maxage` keeps the edge cache if it is ever turned on for this
             * route, and `stale-while-revalidate` still hands over the old
             * copy instantly while the new one is fetched.
             */
            ->header('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
    }

    /**
     * The best-rated games released on one calendar date in earlier years.
     *
     * `$on` carries the year the reader is in, which is what makes "years ago"
     * true on 31 December when tomorrow belongs to the next one.
     */
    private function anniversaries(Carbon $on, int $limit): array
    {
        return Cache::remember(
            "games.on_this_day.v2.{$on->format('m-d')}.{$limit}",
            86400,
            function () use ($on, $limit) {
                $q = Game::query()
                    ->whereNotNull('description')
                    ->whereNotNull('cover_url')
                    ->whereNotNull('released')
                    ->whereYear('released', '<', $on->year)
                    ->where('rating', '>=', 7);

                if (DB::getDriverName() === 'pgsql') {
                    $q->whereRaw('EXTRACT(MONTH FROM released) = ? AND EXTRACT(DAY FROM released) = ?', [$on->month, $on->day]);
                } else {
                    $q->whereRaw("strftime('%m-%d', released) = ?", [$on->format('m-d')]);
                }

                return $q->orderByDesc('rating')
                    ->limit($limit)
                    ->get(['slug', 'name', 'cover_url', 'rating', 'released', 'genres'])
                    // Chosen by rating, shown by year: the panel is a timeline.
                    ->sortByDesc(fn ($g) => $g->released)
                    ->map(fn ($g) => [
                        'slug' => $g->slug,
                        'name' => $g->name,
                        'cover_url' => $g->cover_url,
                        'rating' => (float) $g->rating,
                        'released' => $g->released?->toDateString(),
                        'genres' => array_slice((array) $g->genres, 0, 2),
                        'years_ago' => $on->year - (int) $g->released->format('Y'),
                    ])
                    ->values()
                    ->all();
            }
        );
    }

    /**
     * The home widget's release strip. This used to call RAWG live; the
     * release aggregator's own rows are the calendar now, ordered by the
     * hype the aggregator already computes.
     */
    public function calendar(Request $request)
    {
        $validDate = fn ($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
        $start = $request->query('start_date');
        $end = $request->query('end_date');

        $from = $validDate($start) ? $start : now()->toDateString();
        $to = $validDate($end) ? $end : now()->addDays(90)->toDateString();

        $data = Cache::remember("games.calendar.v2.{$from}.{$to}", 3600, function () use ($from, $to) {
            $games = Game::query()
                ->whereNotNull('match_key')
                ->whereBetween('released', [$from, $to])
                ->orderByDesc('hype_score')
                ->orderBy('released')
                ->limit(60)
                ->get(['id', 'slug', 'name', 'released', 'rating', 'cover_url', 'platforms', 'genres', 'hype_score']);

            return [
                'count' => $games->count(),
                'results' => $games->map(fn ($g) => [
                    'id' => $g->id,
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'released' => $g->released?->toDateString(),
                    'cover_url' => $g->cover_url,
                    'rating' => (float) ($g->rating ?? 0),
                    'genres' => array_slice((array) $g->genres, 0, 3),
                    'platforms' => array_slice((array) $g->platforms, 0, 4),
                    'hype_score' => (int) $g->hype_score,
                ])->all(),
            ];
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=21600');
    }
}
