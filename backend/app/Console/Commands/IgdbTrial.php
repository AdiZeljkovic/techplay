<?php

namespace App\Console\Commands;

use App\Services\Releases\TitleNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * The gate before anything is written: match a sample of our catalogue against
 * IGDB and report what would happen, without doing any of it.
 *
 * This exists because the alternative is finding out afterwards. 142,110 rows
 * updated from somebody else's database is not an operation you inspect by
 * spot-checking the result — either the matching is understood before it runs or
 * it is understood by the reader who lands on Alien (1982) and reads about Alien
 * (2023).
 *
 * It writes nothing. Every run is read-only, and the only output is the report.
 */
class IgdbTrial extends Command
{
    protected $signature = 'igdb:trial
                            {--limit=1000 : How many of our games to try}
                            {--order=random : random, views, or id}
                            {--show=12 : How many worked examples to print per outcome}';

    protected $description = 'Probni prolaz spajanja nase baze s IGDB-om — nista ne upisuje';

    public function handle(TitleNormalizer $normalizer): int
    {
        if (! DB::table('igdb_game_keys')->exists()) {
            $this->error('igdb_game_keys je prazna — pokreni prvo igdb:index.');

            return self::FAILURE;
        }

        $limit = max(1, (int) $this->option('limit'));

        $ours = DB::table('games')
            ->select('id', 'name', 'slug', 'released', 'description', 'cover_url', 'videos',
                'developers', 'publishers', 'age_ratings', 'website', 'series_name')
            ->when($this->option('order') === 'views', fn ($q) => $q->orderByDesc('views'))
            ->when($this->option('order') === 'id', fn ($q) => $q->orderBy('id'))
            ->when($this->option('order') === 'random', fn ($q) => $q->inRandomOrder())
            ->limit($limit)
            ->get();

        $steam = $this->steamBridge();

        $outcome = ['steam' => [], 'key_year' => [], 'key_only' => [], 'ambiguous' => [], 'missing' => []];

        foreach ($ours as $game) {
            $key = $normalizer->key((string) $game->name);
            $year = $game->released ? (int) date('Y', strtotime((string) $game->released)) : null;

            /* a. An exact identifier beats any amount of string cleverness. */
            if (isset($steam[$game->id])) {
                $outcome['steam'][] = [$game, $steam[$game->id]];

                continue;
            }

            if ($key === '') {
                $outcome['missing'][] = [$game, null];

                continue;
            }

            $candidates = DB::table('igdb_game_keys')->where('match_key', $key)->get();

            if ($candidates->isEmpty()) {
                $outcome['missing'][] = [$game, null];

                continue;
            }

            /* b. The title plus the year it came out. */
            if ($year !== null) {
                $sameYear = $candidates->where('release_year', $year);

                if ($sameYear->count() === 1) {
                    $outcome['key_year'][] = [$game, $sameYear->first()];

                    continue;
                }
            }

            /* c. The title alone, and only where the catalogue holds exactly one. */
            if ($candidates->count() === 1) {
                $outcome['key_only'][] = [$game, $candidates->first()];

                continue;
            }

            /* Anything else is a guess, and a guess is what this is here to avoid. */
            $outcome['ambiguous'][] = [$game, $candidates];
        }

        $this->report($outcome, $ours->count(), (int) $this->option('show'));

        return self::SUCCESS;
    }

    /**
     * Our Steam ids against theirs.
     *
     * Empty until the `external_games` endpoint has been pulled — it is 677,219
     * rows and deliberately last in the queue, because nothing else waits on it.
     * Until then this route contributes nothing and the report says so, rather
     * than quietly reading as though we have no Steam ids.
     *
     * @return array<int, object> our game id => the IGDB row
     */
    private function steamBridge(): array
    {
        if (! DB::table('igdb_raw')->where('endpoint', 'external_games')->exists()) {
            return [];
        }

        $ourSteam = DB::table('game_external_ids')
            ->where('provider', 'steam')
            ->pluck('external_id', 'game_id');

        if ($ourSteam->isEmpty()) {
            return [];
        }

        /* Their side, keyed by the Steam appid they carry as `uid`. */
        $theirs = DB::table('igdb_raw')
            ->where('endpoint', 'external_games')
            ->selectRaw("payload->>'uid' as uid, (payload->>'game')::bigint as game_id")
            ->whereRaw("payload->>'uid' is not null")
            ->pluck('game_id', 'uid');

        $bridge = [];

        foreach ($ourSteam as $gameId => $appId) {
            $igdbId = $theirs[(string) $appId] ?? null;

            if ($igdbId && ($row = DB::table('igdb_game_keys')->where('igdb_id', $igdbId)->first())) {
                $bridge[(int) $gameId] = $row;
            }
        }

        return $bridge;
    }

    private function report(array $outcome, int $total, int $show): void
    {
        $counts = array_map('count', $outcome);
        $confident = $counts['steam'] + $counts['key_year'] + $counts['key_only'];

        $this->newLine();
        $this->line('  Uzorak: '.number_format($total).' nasih igara');
        $this->newLine();

        $this->table(
            ['ishod', 'broj', 'udio'],
            [
                ['Steam ID (tacno)', number_format($counts['steam']), $this->pct($counts['steam'], $total)],
                ['naziv + godina', number_format($counts['key_year']), $this->pct($counts['key_year'], $total)],
                ['samo naziv, jedan kandidat', number_format($counts['key_only']), $this->pct($counts['key_only'], $total)],
                ['— pouzdano ukupno —', number_format($confident), $this->pct($confident, $total)],
                ['vise kandidata (ne dira se)', number_format($counts['ambiguous']), $this->pct($counts['ambiguous'], $total)],
                ['nema u IGDB-u', number_format($counts['missing']), $this->pct($counts['missing'], $total)],
            ]
        );

        if ($counts['steam'] === 0) {
            $this->line('  <comment>Steam ID put je prazan: endpoint external_games se jos povlaci.</comment>');
        }

        $this->gains(array_merge($outcome['steam'], $outcome['key_year'], $outcome['key_only']));
        $this->examples($outcome, $show);
    }

    /** What the matched games would actually gain, field by field. */
    private function gains(array $matched): void
    {
        if ($matched === []) {
            return;
        }

        $ids = array_map(fn ($pair) => $pair[1]->igdb_id, $matched);

        $payloads = DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->whereIn('igdb_id', $ids)
            ->pluck('payload', 'igdb_id')
            ->map(fn ($p) => json_decode($p, true) ?: []);

        $rows = [];
        foreach ([
            'opis' => ['description', 'summary'],
            'naslovna' => ['cover_url', 'cover'],
            'traileri' => ['videos', 'videos'],
            'razvojni tim' => ['developers', 'involved_companies'],
            'dobne oznake' => ['age_ratings', 'age_ratings'],
            'sluzbena stranica' => ['website', 'websites'],
            'serijal' => ['series_name', 'collections'],
        ] as $label => [$ourField, $theirField]) {
            $emptyHere = $fillable = 0;

            foreach ($matched as [$game, $key]) {
                $weHave = ! in_array($game->{$ourField}, [null, '', '{}', '[]'], true);

                if ($weHave) {
                    continue;
                }

                $emptyHere++;

                if (! empty($payloads[$key->igdb_id][$theirField] ?? null)) {
                    $fillable++;
                }
            }

            $rows[] = [$label, number_format($emptyHere), number_format($fillable), $this->pct($fillable, max(1, $emptyHere))];
        }

        $this->newLine();
        $this->line('  Sta bi se popunilo kod spojenih igara:');
        $this->table(['polje', 'prazno kod nas', 'IGDB ima', 'popunjeno'], $rows);
    }

    private function examples(array $outcome, int $show): void
    {
        foreach ([
            'key_year' => 'Spojeno po nazivu i godini',
            'key_only' => 'Spojeno samo po nazivu (jedan kandidat)',
            'ambiguous' => 'Vise kandidata — NE dira se',
            'missing' => 'Nema u IGDB-u',
        ] as $bucket => $title) {
            if ($outcome[$bucket] === []) {
                continue;
            }

            $this->newLine();
            $this->line('  '.$title.':');

            foreach (array_slice($outcome[$bucket], 0, $show) as [$game, $match]) {
                if ($bucket === 'ambiguous') {
                    $years = $match->pluck('release_year')->map(fn ($y) => $y ?: '?')->implode(', ');
                    $this->line(sprintf('    %-44s %d kandidata (%s)', mb_substr((string) $game->name, 0, 44), $match->count(), $years));
                } elseif ($bucket === 'missing') {
                    $this->line(sprintf('    %s', mb_substr((string) $game->name, 0, 60)));
                } else {
                    $this->line(sprintf('    %-40s -> %s', mb_substr((string) $game->name, 0, 40), mb_substr((string) $match->name, 0, 40)));
                }
            }
        }

        $this->newLine();
        $this->info('  Nista nije upisano. Ovo je bio samo pregled.');
    }

    private function pct(int $n, int $of): string
    {
        return $of === 0 ? '—' : number_format(100 * $n / $of, 1).'%';
    }
}
