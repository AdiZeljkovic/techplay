<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Writes what people actually did, over what we guessed they would.
 *
 * IGDB's popularity primitives are eleven separate measures, each a number
 * between roughly zero and a quarter, and none of them comparable to another:
 * Steam's 24-hour peak players tops out at 0.19, Twitch hours watched at 0.26,
 * IGDB visits at 0.04. Sorting a mixed list by the raw value would rank by
 * whichever measure happens to produce bigger numbers, which is not a fact
 * about any game.
 *
 * So each game is placed within its own measure — a standing from 0 to 10,000 —
 * and the measure it was placed in is written down beside it. Basis points and
 * not percent because a percentile was too coarse to order anything: its top
 * step held 470 games, which is twenty-three pages of results arranged entirely
 * by the tie-break. Ten thousand steps puts about eight in that bucket.
 *
 * Which measure a game gets depends on what the site is asking:
 *
 *   upcoming   Most Wishlisted Upcoming, then Want to Play. This is the
 *              question `hype_score` was invented to answer, and Steam's
 *              wishlist ranking answers it with a number instead of a guess.
 *   released   Steam 24hr Peak Players, then IGDB Visits, then Want to Play —
 *              who is playing it now, then who is looking it up.
 *
 * Ordering the whole catalogue by peak players would bury every game that is
 * not on Steam, which is why the fallbacks exist and why the metric is stored
 * rather than assumed.
 */
class IgdbPopularity extends Command
{
    protected $signature = 'igdb:popularity
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Upisuje stvarnu popularnost iz IGDB-a (bez --apply samo pregleda)';

    /** Their type ids, from the popularity_types table. */
    private const WISHLISTED_UPCOMING = 10;

    private const WANT_TO_PLAY = 2;

    private const PEAK_PLAYERS = 5;

    private const VISITS = 1;

    /** In order of preference, for a game that has not come out yet. */
    private const UPCOMING = [self::WISHLISTED_UPCOMING, self::WANT_TO_PLAY];

    /** And for one that has. */
    private const RELEASED = [self::PEAK_PLAYERS, self::VISITS, self::WANT_TO_PLAY];

    public function handle(): int
    {
        if (! DB::table('igdb_raw')->where('endpoint', 'popularity_primitives')->exists()) {
            $this->error('Nema povucenih primitiva — pokreni igdb:pull --endpoint=popularity_primitives.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Citam nazive mjera…');
        $names = $this->metricNames();

        $this->line('  Citam vrijednosti i racunam percentile…');
        $ranked = $this->ranked();

        $this->line('  Trazim nase igre…');
        $ours = DB::table('game_external_ids')->where('provider', 'igdb')->pluck('game_id', 'external_id');

        if ($ours->isEmpty()) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om.');

            return self::FAILURE;
        }

        $today = now()->toDateString();
        $written = 0;
        $byMetric = [];
        $bar = $this->output->createProgressBar($ours->count());

        foreach (array_chunk($ours->toArray(), 2000, true) as $chunk) {
            $gameIds = array_values($chunk);

            /* Released or not decides which measure the game is judged by, so
               the dates come along with the ids. */
            $dates = DB::table('games')->whereIn('id', $gameIds)->pluck('released', 'id');
            $updates = [];

            foreach ($chunk as $igdbId => $gameId) {
                $bar->advance();

                $released = $dates[$gameId] ?? null;
                $upcoming = $released === null || substr((string) $released, 0, 10) > $today;
                $order = $upcoming ? self::UPCOMING : self::RELEASED;

                foreach ($order as $type) {
                    $hit = $ranked[$type][(int) $igdbId] ?? null;

                    if ($hit === null) {
                        continue;
                    }

                    $metric = $names[$type] ?? ('type '.$type);
                    $updates[] = [
                        'id' => $gameId,
                        'popularity' => $hit['standing'],
                        'popularity_metric' => $metric,
                        'popularity_raw' => $hit['value'],
                    ];

                    $byMetric[$metric] = ($byMetric[$metric] ?? 0) + 1;
                    $written++;

                    break;
                }
            }

            if ($apply && $updates !== []) {
                $this->write($updates);
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->line(sprintf('  %s %s igara.', $apply ? 'Upisano:' : 'Bilo bi upisano:', number_format($written)));
        arsort($byMetric);
        $this->table(
            ['mjera', 'igara'],
            array_map(fn ($m, $n) => [$m, number_format($n)], array_keys($byMetric), $byMetric),
        );

        if (! $apply) {
            $this->warn('  Nista nije upisano. Dodaj --apply da se sacuva.');
        }

        return self::SUCCESS;
    }

    /** @return array<int, string> */
    private function metricNames(): array
    {
        $names = [];

        foreach (DB::table('igdb_raw')->where('endpoint', 'popularity_types')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];

            if (! empty($p['name'])) {
                /* Their table spells one of these "Postitive Reviews". Left as
                   they wrote it would be our typo on the page. */
                $names[(int) $p['id']] = str_replace('Postitive', 'Positive', (string) $p['name']);
            }
        }

        return $names;
    }

    /**
     * Every game's standing within each measure.
     *
     * The percentile is over IGDB's whole set for that measure, not over the
     * part of it we happen to hold — a game in the top 1% of Steam's peak
     * players is in the top 1% whether or not we carry the other 99%.
     *
     * @return array<int, array<int, array{percentile: int, value: float}>>
     */
    private function ranked(): array
    {
        $values = [];

        DB::table('igdb_raw')
            ->where('endpoint', 'popularity_primitives')
            ->orderBy('igdb_id')
            ->chunk(20000, function ($rows) use (&$values) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $game = (int) ($p['game_id'] ?? 0);
                    $type = (int) ($p['popularity_type'] ?? 0);

                    if ($game === 0 || $type === 0 || ! isset($p['value'])) {
                        continue;
                    }

                    /* A game can carry the same measure more than once as IGDB
                       recalculates; the largest is the one that describes it. */
                    $value = (float) $p['value'];

                    if (! isset($values[$type][$game]) || $value > $values[$type][$game]) {
                        $values[$type][$game] = $value;
                    }
                }
            });

        $ranked = [];

        foreach ($values as $type => $byGame) {
            asort($byGame);
            $total = count($byGame);
            $position = 0;

            foreach ($byGame as $game => $value) {
                $position++;
                /* Ascending sort, so the last position is the most popular, and
                   the scale is basis points rather than percent. At a hundred
                   steps the top one held 470 games and the ordering was decided
                   entirely by the tie-break; at ten thousand it holds about
                   eight. */
                $ranked[$type][$game] = [
                    'standing' => (int) round(($position / $total) * 10000),
                    'value' => $value,
                ];
            }
        }

        return $ranked;
    }

    /**
     * A row at a time, but a transaction per chunk.
     *
     * An UPDATE per game is 152,092 statements; what the batching buys is
     * 152,092 round trips inside 77 commits instead of 152,092 commits, which
     * is where the time actually goes. `UPDATE … FROM (VALUES …)` would make it
     * one statement, and does not exist in SQLite, which is what the tests run
     * on — one path that is fast enough beats two that can disagree.
     *
     * The query builder is used rather than the model: the observer clears a
     * cache key per save, and none of these three columns is one the game page
     * shows today.
     */
    private function write(array $updates): void
    {
        DB::transaction(function () use ($updates) {
            foreach ($updates as $u) {
                DB::table('games')->where('id', $u['id'])->update([
                    'popularity' => $u['popularity'],
                    'popularity_metric' => $u['popularity_metric'],
                    'popularity_raw' => $u['popularity_raw'],
                ]);
            }
        });
    }
}
