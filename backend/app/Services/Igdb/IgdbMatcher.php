<?php

namespace App\Services\Igdb;

use App\Services\Releases\TitleNormalizer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Decides which IGDB game one of ours is, or refuses to.
 *
 * The rules live here and only here. They were written once in the trial command
 * and would have been written a second time in the merge, which is the shape of
 * fault that let a cache key drift from `v2` to `v3` on one side of this codebase
 * last night and stopped edits reaching readers for weeks. A rule spelled twice
 * eventually disagrees with itself.
 *
 * Three routes, in descending order of how much they depend on luck:
 *
 *   steam     an identifier both catalogues carry — no judgement involved
 *   key_year  the normalised title and the year it came out
 *   key_only  the normalised title, where the whole catalogue holds one game by it
 *
 * Everything else is declined. That is not a gap in the matching, it is the
 * matching: `Alien` is seven games between 1982 and 2023, and a merge that always
 * picks one is a merge that eventually gives the 1982 game the 2023 summary.
 */
class IgdbMatcher
{
    public const STEAM = 'steam';

    public const KEY_YEAR = 'key_year';

    public const KEY_ONLY = 'key_only';

    public const AMBIGUOUS = 'ambiguous';

    public const MISSING = 'missing';

    /** our game id => the igdb_game_keys row, built once per run. */
    private array $steamBridge = [];

    private bool $bridgeBuilt = false;

    public function __construct(private readonly TitleNormalizer $normalizer) {}

    /** Whether the Steam route can contribute at all yet. */
    public function steamReady(): bool
    {
        return DB::table('igdb_raw')->where('endpoint', 'external_games')->exists();
    }

    /**
     * @return array{rule: string, row: ?object, candidates: Collection}
     */
    public function match(object $game): array
    {
        $this->buildBridge();

        if (isset($this->steamBridge[$game->id])) {
            return ['rule' => self::STEAM, 'row' => $this->steamBridge[$game->id], 'candidates' => collect()];
        }

        $key = $this->normalizer->key((string) $game->name);

        if ($key === '') {
            return ['rule' => self::MISSING, 'row' => null, 'candidates' => collect()];
        }

        $candidates = DB::table('igdb_game_keys')->where('match_key', $key)->get();

        if ($candidates->isEmpty()) {
            return ['rule' => self::MISSING, 'row' => null, 'candidates' => $candidates];
        }

        $year = $game->released ? (int) date('Y', strtotime((string) $game->released)) : null;

        if ($year !== null) {
            $sameYear = $candidates->where('release_year', $year);

            if ($sameYear->count() === 1) {
                return ['rule' => self::KEY_YEAR, 'row' => $sameYear->first(), 'candidates' => $candidates];
            }
        }

        if ($candidates->count() === 1) {
            return ['rule' => self::KEY_ONLY, 'row' => $candidates->first(), 'candidates' => $candidates];
        }

        return ['rule' => self::AMBIGUOUS, 'row' => null, 'candidates' => $candidates];
    }

    /** The three rules that produce a game to merge from. */
    public static function confident(string $rule): bool
    {
        return in_array($rule, [self::STEAM, self::KEY_YEAR, self::KEY_ONLY], true);
    }

    /**
     * Our Steam appids against theirs.
     *
     * Built lazily and once: it is a join across 38,253 of our rows and 677,219
     * of theirs, and doing it per game would make the merge quadratic in the
     * least interesting way possible.
     *
     * Stays empty until `external_games` has been pulled. Callers ask
     * `steamReady()` and say so, rather than letting an empty bridge read as
     * though we hold no Steam ids at all.
     */
    private function buildBridge(): void
    {
        if ($this->bridgeBuilt) {
            return;
        }

        $this->bridgeBuilt = true;

        if (! $this->steamReady()) {
            return;
        }

        $ourSteam = DB::table('game_external_ids')->where('provider', 'steam')->pluck('external_id', 'game_id');

        if ($ourSteam->isEmpty()) {
            return;
        }

        $theirs = DB::table('igdb_raw')
            ->where('endpoint', 'external_games')
            ->selectRaw("payload->>'uid' as uid, (payload->>'game')::bigint as game_id")
            ->whereRaw("payload->>'uid' is not null")
            ->pluck('game_id', 'uid');

        $wanted = [];
        foreach ($ourSteam as $gameId => $appId) {
            if ($igdbId = $theirs[(string) $appId] ?? null) {
                $wanted[(int) $gameId] = (int) $igdbId;
            }
        }

        if ($wanted === []) {
            return;
        }

        $keys = DB::table('igdb_game_keys')->whereIn('igdb_id', array_values($wanted))->get()->keyBy('igdb_id');

        foreach ($wanted as $gameId => $igdbId) {
            if ($row = $keys->get($igdbId)) {
                $this->steamBridge[$gameId] = $row;
            }
        }
    }
}
