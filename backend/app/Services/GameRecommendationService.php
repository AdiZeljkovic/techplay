<?php

namespace App\Services;

use App\Models\Game;
use App\Models\User;
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
     * The player's taste, read off their collection. Cached briefly because
     * it costs a couple of queries and changes at the speed of a shelf.
     */
    public function tasteProfile(User $user): array
    {
        return Cache::remember("recommend.taste.{$user->id}.v1", 900, function () use ($user) {
            $rows = DB::table('user_games')
                ->join('games', 'games.id', '=', 'user_games.game_id')
                ->where('user_games.user_id', $user->id)
                ->get(['games.id', 'games.genre_names', 'games.released', 'user_games.status', 'user_games.is_favorite']);

            $genreWeights = [];
            $years = [];
            $owned = [];
            $completed = 0;
            $ownedCount = 0;

            foreach ($rows as $row) {
                $owned[] = (int) $row->id;

                if ($row->status !== 'wishlist') {
                    $ownedCount++;
                    if ($row->status === 'completed') {
                        $completed++;
                    }
                }

                // A finished or favourited game says more about taste than a
                // wishlisted one you may never touch.
                $weight = match (true) {
                    (bool) $row->is_favorite => 3.0,
                    $row->status === 'completed' => 2.5,
                    $row->status === 'playing' => 2.0,
                    $row->status === 'wishlist' => 0.6,
                    $row->status === 'dropped' => 0.2,
                    default => 1.0,
                };

                foreach ($this->genresOf($row->genre_names) as $genre) {
                    $genreWeights[$genre] = ($genreWeights[$genre] ?? 0) + $weight;
                }

                $year = $row->released ? (int) substr((string) $row->released, 0, 4) : 0;
                if ($year > 1950) {
                    $years[] = $year;
                }
            }

            arsort($genreWeights);
            $genreTotal = max(1e-6, array_sum($genreWeights));

            return [
                'genres' => collect($genreWeights)->map(fn ($w) => $w / $genreTotal)->all(),
                'top_genres' => array_slice(array_keys($genreWeights), 0, 6),
                'avg_year' => $years ? (int) round(array_sum($years) / count($years)) : null,
                'owned_ids' => $owned,
                'library' => count($rows),
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

        $peers = DB::table('user_games')
            ->whereIn('game_id', $ownedIds)
            ->selectRaw('user_id, COUNT(*) as shared')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) >= 3')
            ->orderByDesc('shared')
            ->limit(200)
            ->pluck('user_id');

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
                'matches_filter' => ! $wanted || array_intersect($this->genresOf($game->genre_names), $wanted),
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
        $genres = $this->genresOf($game->genre_names);

        // Genre: the share of the player's taste this game covers, softened
        // so a single perfect genre doesn't max the component alone.
        $affinity = 0.0;
        foreach ($genres as $genre) {
            $affinity += (float) ($taste['genres'][$genre] ?? 0);
        }
        $genreScore = min(1.0, sqrt(min(1.0, $affinity * 1.6))) * self::WEIGHTS['genre'];

        // Peers: how many taste-alike players own it, against the busiest.
        $owners = (int) ($peerOwners[$game->id] ?? 0);
        $peerScore = $peerMax > 0 ? min(1.0, $owners / $peerMax) * self::WEIGHTS['peers'] : 0.0;

        // Quality: rating first, metacritic as a second opinion.
        $rating = (float) ($game->rating ?: 0);
        $meta = (int) ($game->metacritic ?: 0);
        $quality = $rating > 0 ? min(1.0, ($rating - 3.0) / 2.0) : 0.0;
        if ($meta > 0) {
            $quality = max($quality, min(1.0, ($meta - 60) / 40));
        }
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
        $genres = $this->genresOf($game->genre_names);

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
            $reasons[] = $game->metacritic
                ? "Critically acclaimed — Metacritic {$game->metacritic}"
                : 'Rated highly by players';
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
            'background_image' => $game->background_image,
            'released' => $game->released,
            'rating' => (float) $game->rating,
            'metacritic' => $game->metacritic ? (int) $game->metacritic : null,
            'genres' => array_slice($this->genresOf($game->genre_names), 0, 3),
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
            ->whereNotNull('background_image')
            ->where('rating', '>=', self::MIN_RATING)
            ->when($excludeIds, fn ($q) => $q->whereNotIn('id', $excludeIds));

        // Postgres array overlap keeps the genre filter in the index rather
        // than pulling 200k rows into PHP; sqlite tests fall back to LIKE.
        if ($genres) {
            $driver = $query->getConnection()->getDriverName();

            if ($driver === 'pgsql') {
                $query->whereRaw('genre_names && ?::text[]', ['{'.implode(',', array_map(fn ($g) => '"'.str_replace('"', '', $g).'"', $genres)).'}']);
            } else {
                $query->where(function ($q) use ($genres) {
                    foreach ($genres as $genre) {
                        $q->orWhere('genre_names', 'like', '%'.$genre.'%');
                    }
                });
            }
        }

        $byGenre = $query->orderByDesc('rating')
            ->limit(self::CANDIDATE_POOL)
            ->get(['id', 'slug', 'name', 'background_image', 'released', 'rating', 'metacritic', 'genre_names']);

        // Peer favourites deserve a look even when their genre isn't a match —
        // that is the whole point of a collaborative signal.
        $peerExtras = $peerIds
            ? Game::whereIn('id', array_slice($peerIds, 0, 120))
                ->whereNotIn('id', $excludeIds ?: [0])
                ->whereNotIn('id', $byGenre->pluck('id'))
                ->whereNotNull('background_image')
                ->where('rating', '>=', self::MIN_RATING)
                ->get(['id', 'slug', 'name', 'background_image', 'released', 'rating', 'metacritic', 'genre_names'])
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
                select unnest(genre_names) as genre, count(*) as tally
                from games where genre_names is not null
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
