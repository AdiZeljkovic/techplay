<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Take the anchors out of the game descriptions, once.
 *
 * The descriptions came from MobyGames and carry links back to MobyGames:
 * 57,172 of them across 36,916 game pages, measured 28 Aug 2026. They were
 * nofollowed, so nothing leaked to search — they sent readers from thirty-six
 * thousand of our own pages to a rival catalogue, inside sentences like "the
 * sequel to V Tennis".
 *
 * Rendering already strips them (the `catalogue` HTMLPurifier profile), so this
 * is not what makes the site safe. It is what stops us storing something we
 * have decided never to serve.
 *
 * Safe to run, and safe to stop running:
 *
 *   - The aggregator will not undo it. StoreSync writes `$existing->description
 *     ?: $new`, so a description that is already there is never overwritten,
 *     and MobyGames was retired in the 08/2026 rebuild anyway.
 *   - Only the anchor is touched. Running the whole description through the
 *     purifier would also renormalise every other tag on 36,916 rows — a large
 *     diff to fix a small thing. The regex removes `<a …>` and `</a>` and
 *     leaves the words between them where they are.
 *   - Every row it changes is written to storage/app/backups first, with the
 *     id and the description as it was.
 *
 *     php artisan games:strip-catalogue-links --dry-run
 *     php artisan games:strip-catalogue-links
 */
class StripCatalogueLinks extends Command
{
    protected $signature = 'games:strip-catalogue-links
                            {--dry-run : Report what would change and write nothing}
                            {--chunk=500 : Rows per pass}';

    protected $description = 'Unwrap <a> tags in game descriptions, keeping their text';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $chunk = max(50, (int) $this->option('chunk'));

        // `LIKE '%<a %'` trazi razmak iza tagа, pa promasuje tag prelomljen u
        // novi red i `<a>` bez atributa —
        // uhvaceno testom prije nego je proslo kroz 36.916 redova. Postgres
        // dobija regex, SQLite (na kojem vozi paket testova) siri LIKE; visak
        // redova je bezopasan jer regex ispod odlucuje sta se stvarno mijenja.
        $filter = fn ($q) => DB::getDriverName() === 'pgsql'
            ? $q->whereRaw("description ~* '<a[[:space:]>/]'")
            : $q->where('description', 'like', '%<a%');

        $total = $filter(DB::table('games'))->count();

        if ($total === 0) {
            $this->info('  No description carries an anchor. Nothing to do.');

            return self::SUCCESS;
        }

        $this->line("  {$total} descriptions carry at least one anchor.");

        $backupPath = storage_path('app/backups/game-descriptions-'.now()->format('Y-m-d-His').'.jsonl');

        if (! $dry) {
            File::ensureDirectoryExists(dirname($backupPath));
        }

        $handle = $dry ? null : fopen($backupPath, 'w');

        $changed = 0;
        $anchors = 0;
        $skipped = 0;
        $samples = [];

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $filter(DB::table('games'))
            ->select('id', 'name', 'description')
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use (&$changed, &$anchors, &$skipped, &$samples, $dry, $handle, $bar) {
                foreach ($rows as $row) {
                    $before = (string) $row->description;
                    $found = preg_match_all('/<a\b[^>]*>/i', $before);

                    // Unwrap: the opening tag and the closing tag go, the text
                    // between them stays exactly where it was. Deleting the
                    // whole element would leave "the sequel to , notable as".
                    $after = preg_replace('/<a\b[^>]*>|<\/a\s*>/i', '', $before);

                    if ($after === null || $after === $before) {
                        $skipped++;

                        continue;
                    }

                    if (count($samples) < 3) {
                        $samples[] = [$row->name, $before, $after];
                    }

                    if (! $dry) {
                        fwrite($handle, json_encode([
                            'id' => $row->id,
                            'description' => $before,
                        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");

                        DB::table('games')->where('id', $row->id)->update(['description' => $after]);
                    }

                    $changed++;
                    $anchors += $found;
                    $bar->advance();
                }
            });

        $bar->finish();
        $this->newLine(2);

        if ($handle) {
            fclose($handle);
        }

        foreach ($samples as [$name, $before, $after]) {
            $this->line("  <fg=gray>{$name}</>");
            $this->line('    prije:   '.mb_substr(strip_tags($before, '<a>'), 0, 96));
            $this->line('    poslije: '.mb_substr($after, 0, 96));
            $this->newLine();
        }

        if ($dry) {
            $this->info("  Dry run: {$changed} descriptions would lose {$anchors} anchors. Nothing written.");

            return self::SUCCESS;
        }

        $this->info("  {$changed} descriptions cleaned, {$anchors} anchors removed.");
        $this->line("  Previous text saved to {$backupPath}");

        if ($skipped > 0) {
            $this->line("  {$skipped} matched the filter but held no anchor to remove.");
        }

        // The listing and detail caches hold the old text.
        $this->call('cache:clear');

        return self::SUCCESS;
    }
}
