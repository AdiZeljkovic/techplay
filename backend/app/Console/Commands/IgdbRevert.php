<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;

/**
 * Puts back what a `igdb:merge --replace` run overwrote.
 *
 * The undo file is one JSON object per line — id, slug, and the old value of
 * every column that was replaced — so reverting is a read of that file and
 * nothing else. No matching, no IGDB, no guessing: the row that was there is
 * written back exactly.
 *
 * It reverts by id and checks the slug still agrees, because ids get reused by
 * nothing but a restore from a dump, and writing a 2019 description onto whatever
 * game now holds that id would be worse than the overwrite it is undoing.
 */
class IgdbRevert extends Command
{
    protected $signature = 'igdb:revert
                            {file : Path to the .jsonl.gz written by igdb:merge --replace}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Vraca opise (i ostala polja) koje je igdb:merge --replace prepisao';

    public function handle(): int
    {
        $path = $this->argument('file');

        if (! is_file($path)) {
            $this->error("Nema fajla: {$path}");

            return self::FAILURE;
        }

        $handle = gzopen($path, 'rb');

        if ($handle === false) {
            $this->error("Ne mogu otvoriti {$path}");

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');
        $restored = 0;
        $missing = 0;
        $moved = 0;
        $lines = 0;

        while (($line = gzgets($handle)) !== false) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            $lines++;
            $entry = json_decode($line, true);

            if (! is_array($entry) || empty($entry['id']) || empty($entry['was'])) {
                continue;
            }

            $game = Game::find($entry['id']);

            if (! $game) {
                $missing++;

                continue;
            }

            if ($game->slug !== ($entry['slug'] ?? null)) {
                /* The id now belongs to a different game. Say so and skip —
                   this is the one case where doing nothing is the whole job. */
                $moved++;

                continue;
            }

            $restored++;

            if ($apply) {
                $game->forceFill($entry['was'])->save();
            }
        }

        gzclose($handle);

        $this->newLine();
        $this->line(sprintf('  Zapisa u fajlu: %s', number_format($lines)));
        $this->line(sprintf('  %s %s', $apply ? 'Vraceno:' : 'Bilo bi vraceno:', number_format($restored)));

        if ($missing > 0) {
            $this->line('  '.number_format($missing).' igara vise nema u bazi.');
        }

        if ($moved > 0) {
            $this->warn('  '.number_format($moved).' id-jeva sada nosi druga igra — preskoceni.');
        }

        $this->newLine();

        if (! $apply) {
            $this->warn('  Nista nije upisano. Dodaj --apply da se vrati.');
        }

        return self::SUCCESS;
    }
}
