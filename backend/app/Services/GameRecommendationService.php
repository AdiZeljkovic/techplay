<?php

namespace App\Services;

use App\Models\Game;
use App\Models\User;
use App\Services\Chronicle\TasteProfileService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Recommendations, scored rather than generated. Every point a game earns
 * comes from a named component — genre fit, quality, what players with your
 * taste own, era — and the reasons shown on the card ARE those components.
 * Nothing here is a guess dressed up as a sentence.
 */
class GameRecommendationService
{
    /** @var int[] peers from the chronicle, set per recommend() call */
    private array $chroniclePeers = [];

    /** Weights sum to 100 — the match score is a percentage of a real total. */
    private const WEIGHTS = [
        'genre' => 42,
        'peers' => 26,
        'quality' => 18,
        'era' => 14,
    ];

    /** Below this, a game isn't worth anyone's backlog. */
    private const MIN_RATING = 3.2;

    /** How many candidates to score. Wide enough to be interesting, bounded. */
    private const CANDIDATE_POOL = 400;

    /** Moods map to the genre vocabulary the database actually uses. */
    private const MOODS = [
        'action' => ['Action', 'Shooter', 'Fighting', 'Racing / Driving'],
        'story' => ['Role-playing (RPG)', 'Adventure', 'Visual novel', 'Graphic adventure'],
        'chill' => ['Simulation', 'Puzzle', 'Idle', 'Educational'],
        'competitive' => ['Sports', 'Strategy / tactics', 'Racing / Driving', 'Fighting'],
    ];

    /**
     * The player's taste — read from the chronicle, where every signal the
     * site holds already lives (statuses, favourites, their own scores,
     * hours, sessions, what they read about) with age decay applied. The
     * inventory facts (owned ids, backlog counts) still come from
     * user_games, because those are facts, not taste.
     */
    public function tasteProfile(User $user): array
    {
        return Cache::remember("recommend.taste.{$user->id}.v2", 900, function () use ($user) {
            $rows = DB::table('user_games')
                ->where('user_id', $user->id)
                ->get(['game_id', 'status']);

            $owned = $rows->pluck('game_id')->map(fn ($id) => (int) $id)->all();
            $ownedCount = $rows->where('status', '!=', 'wishlist')->count();
            $completed = $rows->where('status', 'completed')->count();

            $taste = app(TasteProfileService::class);
            $genreWeights = $taste->genreWeights($user);
            $genreTotal = max(1e-6, array_sum($genreWeights));

            return [
                'genres' => collect($genreWeights)->map(fn ($w) => $w / $genreTotal)->all(),
                'top_genres' => $taste->topGenres($user),
                'negative_genres' => $taste->negativeGenres($user),
                'avg_year' => $taste->avgYear($user),
                'owned_ids' => $owned,
                'library' => $rows->count(),
                'completion_rate' => $ownedCount > 0 ? (int) round($completed / $ownedCount * 100) : 0,
                'backlog' => $rows->where('status', 'backlog')->count(),
                'completed' => $completed,
            ];
        });
    }

    /**
     * Players whose shelves overlap yours. The collaborative signal is
     * literally "people who own what you own also own this" — computed, not
     * claimed. Empty for a small library, and the component simply scores 0.
     *
     * @return Collection<int,int> candidate game id => peer owners
     */
    private function peerSignal(array $ownedIds): Collection
    {
        if (count($ownedIds) < 3) {
            return collect();
        }

        // The chronicle already knows who resembles this player (cosine over
        // game affinities, all signals included) — trust it first, and fall
        // back to raw shelf overlap for users it has not met yet.
        $peers = collect($this->chroniclePeers ?? []);

        if ($peers->isEmpty()) {
            $peers = DB::table('user_games')
                ->whereIn('game_id', $ownedIds)
                ->selectRaw('user_id, COUNT(*) as shared')
                ->groupBy('user_id')
                ->havingRaw('COUNT(*) >= 3')
                ->orderByDesc('shared')
                ->limit(200)
                ->pluck('user_id');
        }

        if ($peers->isEmpty()) {
            return collect();
        }

        return DB::table('user_games')
            ->whereIn('user_id', $peers)
            ->whereNotIn('game_id', $ownedIds)
            ->selectRaw('game_id, COUNT(DISTINCT user_id) as owners')
            ->groupBy('game_id')
            ->orderByDesc('owners')
            ->limit(600)
            ->pluck('owners', 'game_id');
    }

    /**
     * The recommendations themselves.
     *
     * @param  array{mood?:string,genres?:array,exclude_backlog?:bool,exclude_played?:bool}  $filters
     */
    public function recommend(User $user, array $filters = [], int $limit = 12): array
    {
        $taste = $this->tasteProfile($user);
        $this->chroniclePeers = app(TasteProfileService::class)->peerIds($user);
        $peerOwners = $this->peerSignal($taste['owned_ids']);
        $peerMax = max(1, (int) $peerOwners->max());

        // Which genres to search on: an explicit filter, then the mood, then
        // whatever the player already plays.
        $wanted = array_values(array_filter((array) ($filters['genres'] ?? [])));

        if (! $wanted && ! empty($filters['mood']) && isset(self::MOODS[$filters['mood']])) {
            $wanted = self::MOODS[$filters['mood']];
        }

        $searchGenres = $wanted ?: $taste['top_genres'];

        $excludeIds = $this->excludedIds($user, $taste, $filters);

        $candidates = $this->candidatePool($searchGenres, $excludeIds, $peerOwners->keys()->all());

        $scored = $candidates->map(function (Game $game) use ($taste, $peerOwners, $peerMax, $wanted) {
            $components = $this->score($game, $taste, $peerOwners, $peerMax);
            $total = array_sum($components);

            return [
                'game' => $game,
                'components' => $components,
                'score' => $total,
                // A filtered search should honour the filter strictly.
                'matches_filter' => ! $wanted || array_intersect($this->genresOf($game->genres), $wanted),
            ];
        })
            ->filter(fn (array $row) => $row['matches_filter'])
            ->sortByDesc('score')
            ->take($limit)
            ->values();

        return $scored->map(fn (array $row) => $this->present($row, $taste, $peerOwners))->all();
    }

    /* ── scoring ──────────────────────────────────────────────────────── */

    /** @return array<string,float> */
    private function score(Game $game, array $taste, Collection $peerOwners, int $peerMax): array
    {
        $genres = $this->genresOf($game->genres);

        // Genre: the share of the player's taste this game covers, softened
        // so a single perfect genre doesn't max the component alone.
        $affinity = 0.0;
        foreach ($genres as $genre) {
            $affinity += (float) ($taste['genres'][$genre] ?? 0);
        }
        // What they bounced off pushes back: a dropped-genre match halves
        // its own contribution rather than banning the game outright.
        $repulsion = 0.0;
        foreach ($genres as $genre) {
            $repulsion += (float) ($taste['negative_genres'][$genre] ?? 0);
        }

        $genreScore = max(0.0, min(1.0, sqrt(min(1.0, $affinity * 1.6))) - min(0.5, $repulsion * 0.5)) * self::WEIGHTS['genre'];

        // Peers: how many taste-alike players own it, against the busiest.
        $owners = (int) ($peerOwners[$game->id] ?? 0);
        $peerScore = $peerMax > 0 ? min(1.0, $owners / $peerMax) * self::WEIGHTS['peers'] : 0.0;

        // Quality: the catalogue's own player rating.
        $rating = (float) ($game->rating ?: 0);
        $quality = $rating > 0 ? min(1.0, ($rating - 3.0) / 2.0) : 0.0;
        $qualityScore = max(0.0, $quality) * self::WEIGHTS['quality'];

        // Era: how close its release sits to the era the player lives in.
        $eraScore = self::WEIGHTS['era'] * 0.5;
        $year = $game->released ? (int) substr((string) $game->released, 0, 4) : 0;
        if ($taste['avg_year'] && $year > 1950) {
            $distance = abs($year - $taste['avg_year']);
            $eraScore = max(0.0, 1 - $distance / 25) * self::WEIGHTS['era'];
        }

        return [
            'genre' => round($genreScore, 2),
            'peers' => round($peerScore, 2),
            'quality' => round($qualityScore, 2),
            'era' => round($eraScore, 2),
        ];
    }

    /**
     * The card's bullets: the components that actually earned points, said
     * plainly. No component, no bullet.
     *
     * @return string[]
     */
    private function reasons(Game $game, array $components, array $taste, int $peerOwners): array
    {
        $reasons = [];
        $genres = $this->genresOf($game->genres);

        if ($components['genre'] >= self::WEIGHTS['genre'] * 0.45) {
            $shared = array_values(array_intersect($genres, $taste['top_genres']));
            $reasons[] = $shared
                ? 'Matches your taste for '.$this->humanList(array_slice($shared, 0, 2))
                : 'Fits the genres you play most';
        }

        if ($peerOwners > 0 && $components['peers'] >= self::WEIGHTS['peers'] * 0.3) {
            $reasons[] = $peerOwners === 1
                ? 'A player with your taste owns it'
                : "{$peerOwners} players with your taste own it";
        }

        if ($components['quality'] >= self::WEIGHTS['quality'] * 0.6) {
            $reasons[] = 'Rated highly by players';
        }

        if ($components['era'] >= self::WEIGHTS['era'] * 0.7 && $taste['avg_year']) {
            $reasons[] = 'From the era your collection lives in';
        }

        if ($taste['completion_rate'] >= 50 && $components['genre'] > 0) {
            $reasons[] = 'You finish what you start — this is worth starting';
        }

        return array_slice($reasons, 0, 3);
    }

    private function present(array $row, array $taste, Collection $peerOwners): array
    {
        /** @var Game $game */
        $game = $row['game'];
        $owners = (int) ($peerOwners[$game->id] ?? 0);
        $maxScore = array_sum(self::WEIGHTS);

        return [
            'slug' => $game->slug,
            'name' => $game->name,
            'cover_url' => $game->cover_url,
            'released' => $game->released,
            'rating' => (float) $game->rating,
            'genres' => array_slice($this->genresOf($game->genres), 0, 3),
            'match_score' => (int) round($row['score'] / $maxScore * 100),
            'reasons' => $this->reasons($game, $row['components'], $taste, $owners),
            // The working, for anyone who wants to see it.
            'breakdown' => [
                ['key' => 'genre', 'label' => 'Genre fit', 'value' => (int) round($row['components']['genre']), 'max' => self::WEIGHTS['genre']],
                ['key' => 'peers', 'label' => 'Players like you', 'value' => (int) round($row['components']['peers']), 'max' => self::WEIGHTS['peers']],
                ['key' => 'quality', 'label' => 'Quality', 'value' => (int) round($row['components']['quality']), 'max' => self::WEIGHTS['quality']],
                ['key' => 'era', 'label' => 'Era fit', 'value' => (int) round($row['components']['era']), 'max' => self::WEIGHTS['era']],
            ],
        ];
    }

    /* ── candidates ───────────────────────────────────────────────────── */

    /** @return Collection<int,Game> */
    private function candidatePool(array $genres, array $excludeIds, array $peerIds): Collection
    {
        $query = Game::query()
            ->whereNotNull('cover_url')
            ->where('rating', '>=', self::MIN_RATING)
            ->when($excludeIds, fn ($q) => $q->whereNotIn('id', $excludeIds));

        // Postgres array overlap keeps the genre filter in the index rather
        // than pulling 200k rows into PHP; sqlite tests fall back to LIKE.
        if ($genres) {
            $driver = $query->getConnection()->getDriverName();

            if ($driver === 'pgsql') {
                $query->whereRaw('genres && ?::text[]', ['{'.implode(',', array_map(fn ($g) => '"'.str_replace('"', '', $g).'"', $genres)).'}']);
            } else {
                $query->where(function ($q) use ($genres) {
                    foreach ($genres as $genre) {
                        $q->orWhere('genres', 'like', '%'.$genre.'%');
                    }
                });
            }
        }

        $byGenre = $query->orderByDesc('rating')
            ->limit(self::CANDIDATE_POOL)
            ->get(['id', 'slug', 'name', 'cover_url', 'released', 'rating', 'genres']);

        // Peer favourites deserve a look even when their genre isn't a match —
        // that is the whole point of a collaborative signal.
        $peerExtras = $peerIds
            ? Game::whereIn('id', array_slice($peerIds, 0, 120))
                ->whereNotIn('id', $excludeIds ?: [0])
                ->whereNotIn('id', $byGenre->pluck('id'))
                ->whereNotNull('cover_url')
                ->where('rating', '>=', self::MIN_RATING)
                ->get(['id', 'slug', 'name', 'cover_url', 'released', 'rating', 'genres'])
            : collect();

        return $byGenre->concat($peerExtras);
    }

    private function excludedIds(User $user, array $taste, array $filters): array
    {
        // A recommendation you already own is not a recommendation.
        $excluded = DB::table('user_games')
            ->where('user_id', $user->id)
            ->when(
                ! ($filters['exclude_backlog'] ?? true) && ! ($filters['exclude_played'] ?? true),
                fn ($q) => $q->whereIn('status', ['playing', 'completed', 'dropped', 'wishlist'])
            )
            ->pluck('game_id')
            ->all();

        return $excluded;
    }

    /* ── the dashboard strip ──────────────────────────────────────────── */

    public function summary(User $user): array
    {
        $taste = $this->tasteProfile($user);

        // Backlog health: a shelf you are working through, not one that only
        // grows. Completion pulls it up, an unplayed pile pulls it down.
        $backlog = $taste['backlog'];
        $library = max(1, $taste['library']);
        $pressure = min(1.0, $backlog / max(8, $library * 0.6));
        $health = (int) round(max(0, min(100, $taste['completion_rate'] * 0.7 + (1 - $pressure) * 30)));

        return [
            'backlog' => $backlog,
            'library' => $taste['library'],
            'completed' => $taste['completed'],
            'completion_rate' => $taste['completion_rate'],
            'top_genres' => array_slice($taste['top_genres'], 0, 3),
            'health' => $health,
            'health_note' => match (true) {
                $taste['library'] === 0 => 'Add a few games and this starts working.',
                // Nothing waiting is not the same as drowning. Without this,
                // a shelf with an empty backlog and nothing finished scored 30
                // and was told "the pile is winning" — about a pile of zero.
                $backlog === 0 => 'Nothing waiting. Add something you mean to play next.',
                $health >= 70 => "Looking good — you're making progress.",
                $health >= 40 => 'Holding steady. Finish one before adding three.',
                default => 'The pile is winning. Pick something short and clear it.',
            },
        ];
    }

    /** Every genre the catalogue offers, for the refine rail. */
    public function availableGenres(): array
    {
        return Cache::remember('recommend.genres.v1', 86400, function () {
            $driver = DB::connection()->getDriverName();

            if ($driver !== 'pgsql') {
                return ['Action', 'Adventure', 'Role-playing (RPG)', 'Strategy / tactics', 'Simulation', 'Puzzle', 'Sports', 'Racing / Driving'];
            }

            return collect(DB::select('
                select unnest(genres) as genre, count(*) as tally
                from games where genres is not null
                group by 1 order by tally desc limit 14
            '))
                ->pluck('genre')
                ->reject(fn ($g) => in_array($g, ['Add-on', 'Compilation', 'Special edition'], true))
                ->values()
                ->all();
        });
    }

    /* ── helpers ──────────────────────────────────────────────────────── */

    /** @return string[] */
    private function genresOf(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        $trimmed = trim($raw, '{}');

        if ($trimmed === '') {
            return [];
        }

        return array_map(
            fn (string $part) => trim($part, ' "'),
            preg_split('/,(?=(?:[^"]*"[^"]*")*[^"]*$)/', $trimmed) ?: []
        );
    }

    private function humanList(array $items): string
    {
        if (count($items) <= 1) {
            return $items[0] ?? '';
        }

        return implode(' and ', $items);
    }
}
