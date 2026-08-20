<?php

namespace App\Console\Commands;

use App\Services\Releases\TitleNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Works out the comparable form of every IGDB title, once.
 *
 * Normalising a title is cheap; normalising 372,826 of them for every run of the
 * merge is not, and doing it inside the merge would mean the merge could never
 * be a join. So it happens here, into `igdb_game_keys`, and everything after
 * this is SQL.
 *
 * Run again after a fresh pull: IGDB renames entries, and a key computed from a
 * name they have since corrected is a key that stops matching.
 */
class IgdbIndex extends Command
{
    protected $signature = 'igdb:index {--chunk=5000 : How many payloads to read at a time}';

    protected $description = 'Racuna uporedive nazive IGDB igara u igdb_game_keys';

    public function handle(TitleNormalizer $normalizer): int
    {
        $total = DB::table('igdb_raw')->where('endpoint', 'games')->count();

        if ($total === 0) {
            $this->error('igdb_raw nema nijednu igru — pokreni prvo igdb:pull.');

            return self::FAILURE;
        }

        $this->line('  '.number_format($total).' igara iz igdb_raw');
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $written = 0;
        $skipped = 0;

        DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->orderBy('igdb_id')
            ->chunk((int) $this->option('chunk'), function ($rows) use ($normalizer, $bar, &$written, &$skipped) {
                $batch = [];

                foreach ($rows as $row) {
                    $game = json_decode($row->payload, true) ?: [];
                    $name = trim((string) ($game['name'] ?? ''));

                    if ($name === '') {
                        $skipped++;

                        continue;
                    }

                    $key = $normalizer->key($name);

                    if ($key === '') {
                        /*
                         * A title made entirely of decoration — the normaliser
                         * strips it to nothing. It cannot be matched on, and
                         * pretending otherwise would match it to everything.
                         */
                        $skipped++;

                        continue;
                    }

                    $stamp = $game['first_release_date'] ?? null;

                    $batch[] = [
                        'igdb_id' => (int) $row->igdb_id,
                        'match_key' => mb_substr($key, 0, 255),
                        'release_year' => $stamp ? (int) gmdate('Y', (int) $stamp) : null,
                        'name' => mb_substr($name, 0, 500),
                    ];
                }

                if ($batch !== []) {
                    DB::table('igdb_game_keys')->upsert($batch, ['igdb_id'], ['match_key', 'release_year', 'name']);
                    $written += count($batch);
                }

                $bar->advance($rows->count());
            });

        $bar->finish();
        $this->newLine();

        $distinct = DB::table('igdb_game_keys')->distinct()->count('match_key');

        $this->info(sprintf(
            '  %s kljuceva, %s razlicitih%s',
            number_format($written),
            number_format($distinct),
            $skipped ? ', '.number_format($skipped).' preskoceno (naziv se ne da normalizovati)' : ''
        ));

        return self::SUCCESS;
    }
}
