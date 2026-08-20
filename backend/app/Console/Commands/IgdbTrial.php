<?php

namespace App\Console\Commands;

use App\Services\Igdb\IgdbMatcher;
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

    public function handle(IgdbMatcher $matcher): int
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

        $outcome = ['steam' => [], 'key_year' => [], 'key_only' => [], 'ambiguous' => [], 'missing' => []];

        foreach ($ours as $game) {
            /* The rules live in IgdbMatcher, so that the run which reports and
               the run which writes can never disagree about what a match is. */
            $result = $matcher->match($game);

            $outcome[$result['rule']][] = [
                $game,
                $result['rule'] === IgdbMatcher::AMBIGUOUS ? $result['candidates'] : $result['row'],
            ];
        }

        $this->report($outcome, $ours->count(), (int) $this->option('show'));

        return self::SUCCESS;
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
