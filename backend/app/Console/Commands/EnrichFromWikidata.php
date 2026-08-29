<?php

namespace App\Console\Commands;

use App\Services\Releases\TalksToStores;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * The catalogue borrows what Wikidata knows — legally its to keep, since
 * Wikidata is CC0.
 *
 * The sweep goes year by year — one SPARQL query per release year — because
 * WDQS times out on any single grouped query over all ~100k game items.
 * Matching is the strict pair the whole cleanup has trusted: exact
 * lowercase name AND a release year within one, both sides known — never
 * name alone, because fifty-one games are called Backgammon.
 *
 * This is the only realistic source for series (Moby's group ids never
 * made it into the export) and the best one for companies on everything
 * Steam does not carry: console exclusives, retro, the deep catalogue.
 * Only empty columns are written; locked_fields is respected.
 */
class EnrichFromWikidata extends Command
{
    use TalksToStores;

    protected $signature = 'games:enrich-wikidata
        {--dry-run : Count what would be filled, write nothing}';

    protected $description = 'Fill series, developers and publishers from Wikidata (CC0), matched by name + year';

    private const ENDPOINT = 'https://query.wikidata.org/sparql';

    private const FIRST_YEAR = 1970;

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        // ── our side of the join: name+year → game ids ───────────────────
        $ours = [];
        // chunkById seeks past the last id read; chunk re-walks from the top
        // with an OFFSET each pass, which on 332,000 rows is most of the cost.
        DB::table('games')->select(['id', 'name', 'released'])
            ->chunkById(10000, function ($games) use (&$ours) {
                foreach ($games as $g) {
                    $year = $g->released ? (int) substr($g->released, 0, 4) : null;
                    $ours[mb_strtolower(trim($g->name))][] = ['id' => $g->id, 'year' => $year];
                }
            });
        $this->info(number_format(count($ours)).' imena u katalogu.');

        $filled = ['series' => 0, 'developers' => 0, 'publishers' => 0];

        foreach (range(self::FIRST_YEAR, now()->year + 2) as $year) {
            try {
                $rows = $this->year($year);
            } catch (\Throwable $e) {
                $this->warn("  {$year}: ".$e->getMessage());

                continue;
            }
            $this->line("  {$year} → ".count($rows).' igara');

            foreach ($rows as $row) {
                foreach ($ours[mb_strtolower(trim($row['label']))] ?? [] as $candidate) {
                    // Both years known and within one — never name alone.
                    if ($candidate['year'] === null || abs($candidate['year'] - $year) > 1) {
                        continue;
                    }

                    $this->apply($candidate['id'], $row, $dry, $filled);
                }
            }

            sleep(2); // WDQS courtesy pause
        }

        $this->info(sprintf(
            '%sPopunjeno — serije: %s, developeri: %s, publisheri: %s',
            $dry ? '[dry-run] ' : '',
            number_format($filled['series']), number_format($filled['developers']), number_format($filled['publishers'])
        ));

        return self::SUCCESS;
    }

    /**
     * Every game Wikidata files under one release year — a slice small
     * enough that the grouped query returns well inside WDQS's 60 seconds.
     *
     * @return array<int,array{label:string,series_qid:?int,series:?string,developers:string[],publishers:string[]}>
     */
    private function year(int $year): array
    {
        $query = <<<SPARQL
            SELECT ?game ?gameLabel
                   (SAMPLE(?series) AS ?seriesItem) (SAMPLE(?seriesLabel) AS ?seriesName)
                   (GROUP_CONCAT(DISTINCT ?devLabel; separator="|") AS ?devs)
                   (GROUP_CONCAT(DISTINCT ?pubLabel; separator="|") AS ?pubs)
            WHERE {
              ?game wdt:P31 wd:Q7889 ;
                    wdt:P577 ?date .
              FILTER(YEAR(?date) = {$year})
              OPTIONAL { ?game wdt:P179 ?series .
                         ?series rdfs:label ?seriesLabel FILTER(LANG(?seriesLabel) = "en") . }
              OPTIONAL { ?game wdt:P178 ?dev .
                         ?dev rdfs:label ?devLabel FILTER(LANG(?devLabel) = "en") . }
              OPTIONAL { ?game wdt:P123 ?pub .
                         ?pub rdfs:label ?pubLabel FILTER(LANG(?pubLabel) = "en") . }
              ?game rdfs:label ?gameLabel FILTER(LANG(?gameLabel) = "en") .
            }
            GROUP BY ?game ?gameLabel
            SPARQL;

        $response = $this->http(120)
            ->withHeaders([
                'User-Agent' => 'TechPlayCatalogueBot/1.0 (https://techplay.gg; redakcija@techplay.gg)',
                'Accept' => 'application/sparql-results+json',
            ])
            ->retry(3, 10000)
            ->get(self::ENDPOINT, [
                'query' => $query,
                'format' => 'json',
            ])
            ->throw();

        return collect($response->json('results.bindings') ?? [])
            ->map(function ($b) {
                $seriesUri = $b['seriesItem']['value'] ?? null;

                return [
                    'label' => $b['gameLabel']['value'] ?? '',
                    'series_qid' => $seriesUri && preg_match('/Q(\d+)$/', $seriesUri, $m) ? (int) $m[1] : null,
                    'series' => $b['seriesName']['value'] ?? null,
                    'developers' => array_values(array_filter(explode('|', $b['devs']['value'] ?? ''))),
                    'publishers' => array_values(array_filter(explode('|', $b['pubs']['value'] ?? ''))),
                ];
            })
            ->filter(fn ($r) => $r['label'] !== '')
            ->values()
            ->all();
    }

    /** @param array{series_qid:?int,series:?string,developers:string[],publishers:string[]} $row */
    private function apply(int $gameId, array $row, bool $dry, array &$filled): void
    {
        $game = DB::table('games')->where('id', $gameId)
            ->first(['id', 'series_key', 'developers', 'publishers', 'locked_fields']);
        if (! $game) {
            return;
        }

        $locked = json_decode($game->locked_fields ?? '[]', true) ?: [];
        $update = [];

        if ($row['series_qid'] && $game->series_key === null && ! in_array('series_key', $locked, true)) {
            $update['series_key'] = $row['series_qid'];
            $update['series_name'] = $row['series'];
            $filled['series']++;
        }
        if ($row['developers'] !== [] && ($game->developers === null || $game->developers === '{}') && ! in_array('developers', $locked, true)) {
            $update['developers'] = $this->pgTextArray($row['developers']);
            $filled['developers']++;
        }
        if ($row['publishers'] !== [] && ($game->publishers === null || $game->publishers === '{}') && ! in_array('publishers', $locked, true)) {
            $update['publishers'] = $this->pgTextArray($row['publishers']);
            $filled['publishers']++;
        }

        if ($update !== [] && ! $dry) {
            DB::table('games')->where('id', $gameId)->update($update + ['updated_at' => now()]);
        }
    }

    private function pgTextArray(array $values): string
    {
        $quoted = array_map(fn ($v) => '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $v).'"', $values);

        return '{'.implode(',', $quoted).'}';
    }
}
