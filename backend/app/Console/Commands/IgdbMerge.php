<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Igdb\IgdbFacts;
use App\Services\Igdb\IgdbMatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Writes IGDB's data into our games — by default only where ours is empty.
 *
 * The rule that shapes everything here: **it fills, it does not replace.** A
 * column we already have a value for is left exactly as it is, whatever IGDB
 * thinks. That makes the merge safe to run twice, safe to run while somebody is
 * editing, and impossible to use as a way of losing work — which matters more
 * than any of the data it adds, because the data can be fetched again and an
 * overwritten description cannot.
 *
 * `--replace=description` lifts that rule for one named column, deliberately and
 * per run, because our descriptions came out of store pages and theirs are
 * written to describe a game rather than sell it. Two things hold when it does:
 * every value it overwrites is written to a gzipped undo file first — no undo
 * file, no run — and a game marked `is_editorial` is still only ever filled,
 * because what stands in its columns was put there by a person.
 *
 * Four things are never touched at all:
 *
 *   slug            114,861 of our game pages have been visited. Changing a slug
 *                   is not an edit, it is a 404 with a redirect we forgot to add.
 *   views           ours, and the only signal we have about which pages matter.
 *   is_editorial    a game somebody wrote about by hand.
 *   locked_fields   the existing mechanism for "leave this alone" — respected
 *                   per column, not per row.
 *
 * A merge also records which IGDB game it decided on, in `game_external_ids`.
 * The second run then knows rather than guesses, and a title that IGDB later
 * renames stays attached to the right entry.
 */
class IgdbMerge extends Command
{
    protected $signature = 'igdb:merge
                            {--limit=1000 : How many of our games to consider}
                            {--order=views : views, random, or id}
                            {--replace=* : Fields IGDB may overwrite, not just fill}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Popunjava prazna polja nasih igara IGDB podacima (bez --apply samo pregleda)';

    /** What this round can fill, given what has been pulled so far. */
    private const FIELDS = ['description', 'cover_url', 'videos', 'developers', 'publishers', 'alt_titles', 'series_key', 'series_name', 'released'];

    /** Open handle to this run's undo file, or null when nothing is replaced. */
    private $undo = null;

    private ?string $undoPath = null;

    public function handle(IgdbMatcher $matcher, IgdbFacts $facts): int
    {
        if (! DB::table('igdb_game_keys')->exists()) {
            $this->error('igdb_game_keys je prazna — pokreni prvo igdb:index.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $replace = array_values(array_intersect(self::FIELDS, (array) $this->option('replace')));
        $unknown = array_diff((array) $this->option('replace'), self::FIELDS);

        if ($unknown !== []) {
            $this->error('Nepoznato polje za --replace: '.implode(', ', $unknown));

            return self::FAILURE;
        }

        if ($replace !== [] && $apply && ! $this->openUndo()) {
            return self::FAILURE;
        }

        $ours = Game::query()
            ->when($this->option('order') === 'views', fn ($q) => $q->orderByDesc('views'))
            ->when($this->option('order') === 'id', fn ($q) => $q->orderBy('id'))
            ->when($this->option('order') === 'random', fn ($q) => $q->inRandomOrder())
            ->limit(max(1, (int) $this->option('limit')))
            ->get();

        /* Match first, then load their side once for everything matched. */
        $matched = [];
        foreach ($ours as $game) {
            $result = $matcher->match($game);

            if (IgdbMatcher::confident($result['rule'])) {
                $matched[$game->id] = [$game, (int) $result['row']->igdb_id, $result['rule']];
            }
        }

        if ($matched === []) {
            $this->warn('  Nijedna igra iz uzorka nije pouzdano spojena.');

            return self::SUCCESS;
        }

        $facts->load(array_map(fn ($m) => $m[1], $matched));

        $filled = array_fill_keys(self::FIELDS, 0);
        $replaced = array_fill_keys(self::FIELDS, 0);
        $touched = 0;
        $locked = 0;
        $spared = 0;

        foreach ($matched as [$game, $igdbId, $rule]) {
            $available = $facts->forGame($igdbId);
            $lockedHere = (array) ($game->locked_fields ?? []);
            $updates = [];
            $overwritten = [];

            /* A game the redakcija wrote about by hand is filled but never
               replaced. Whatever stands in its columns was put there by a
               person, and no catalogue is a reason to lose that. */
            $mayReplace = $game->is_editorial ? [] : $replace;

            foreach (self::FIELDS as $field) {
                if (! array_key_exists($field, $available)) {
                    continue;
                }

                if (in_array($field, $lockedHere, true)) {
                    $locked++;

                    continue;
                }

                if (! $this->isEmpty($game->{$field})) {
                    if (! in_array($field, $mayReplace, true)) {
                        if ($game->is_editorial && in_array($field, $replace, true)) {
                            $spared++;
                        }

                        continue;   // ours stays
                    }

                    if ($available[$field] === $game->{$field}) {
                        continue;   // already theirs
                    }

                    $overwritten[$field] = $game->{$field};
                }

                $updates[$field] = $available[$field];
            }

            if ($updates === []) {
                continue;
            }

            $touched++;
            foreach (array_keys($updates) as $field) {
                isset($overwritten[$field]) ? $replaced[$field]++ : $filled[$field]++;
            }

            if ($apply) {
                $this->recordUndo($game, $overwritten);

                DB::transaction(function () use ($game, $updates, $igdbId) {
                    $game->forceFill($updates)->save();

                    /* So the next run knows which game this is rather than
                       working it out from the title again. */
                    DB::table('game_external_ids')->updateOrInsert(
                        ['game_id' => $game->id, 'provider' => 'igdb'],
                        ['external_id' => (string) $igdbId, 'updated_at' => now(), 'created_at' => now()],
                    );
                });
            }
        }

        $this->closeUndo();
        $this->report($ours->count(), count($matched), $touched, $filled, $replaced, $locked, $spared, $apply);

        return self::SUCCESS;
    }

    /**
     * The undo file for a run that replaces rather than fills.
     *
     * One JSON object per line, gzipped as it is written — 142,110 old
     * descriptions averaging 1,292 characters is about 180 MB held in memory if
     * collected first, and the whole point of the file is to survive a run that
     * ran out of it. Reversing is a read of this file and nothing else.
     */
    private function openUndo(): bool
    {
        $dir = storage_path('app/backups');

        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            $this->error("Ne mogu napraviti {$dir} — zamjena bez zapisa za povratak se ne izvodi.");

            return false;
        }

        $this->undoPath = $dir.'/igdb-replace-'.now()->format('Y-m-d-His').'.jsonl.gz';
        $this->undo = gzopen($this->undoPath, 'wb6');

        if ($this->undo === false) {
            $this->undo = null;
            $this->error("Ne mogu pisati u {$this->undoPath} — zamjena se ne izvodi.");

            return false;
        }

        return true;
    }

    private function recordUndo(Game $game, array $overwritten): void
    {
        if ($this->undo === null || $overwritten === []) {
            return;
        }

        gzwrite($this->undo, json_encode([
            'id' => $game->id,
            'slug' => $game->slug,
            'was' => $overwritten,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
    }

    private function closeUndo(): void
    {
        if ($this->undo !== null) {
            gzclose($this->undo);
            $this->undo = null;
        }
    }

    /**
     * Empty enough to fill.
     *
     * Postgres arrays arrive as `{}` and jsonb as `[]`, and both mean "nothing
     * here" as surely as null does. A check for null alone would leave every
     * game that had once been touched by the aggregator looking full.
     */
    private function isEmpty(mixed $value): bool
    {
        if ($value === null || $value === '' || $value === '{}' || $value === '[]') {
            return true;
        }

        return is_array($value) && $value === [];
    }

    private function report(int $sampled, int $matched, int $touched, array $filled, array $replaced, int $locked, int $spared, bool $apply): void
    {
        $this->newLine();
        $this->line(sprintf(
            '  Uzorak %s — pouzdano spojeno %s, izmijenjeno %s',
            number_format($sampled), number_format($matched), number_format($touched)
        ));
        $this->newLine();

        $rows = [];
        foreach (self::FIELDS as $field) {
            if ($filled[$field] > 0 || $replaced[$field] > 0) {
                $rows[] = [
                    $field,
                    $filled[$field] > 0 ? number_format($filled[$field]) : '—',
                    $replaced[$field] > 0 ? number_format($replaced[$field]) : '—',
                ];
            }
        }

        $this->table(
            ['polje', $apply ? 'popunjeno' : 'bilo bi popunjeno', $apply ? 'prepisano' : 'bilo bi prepisano'],
            $rows ?: [['—', '0', '0']],
        );

        if ($locked > 0) {
            $this->line('  '.number_format($locked).' polja preskoceno jer su zakljucana (locked_fields).');
        }

        if ($spared > 0) {
            $this->line('  '.number_format($spared).' polja sacuvano jer je igra editorial — te se popunjavaju, ne prepisuju.');
        }

        $this->newLine();
        if (! $apply) {
            $this->warn('  Nista nije upisano. Dodaj --apply da se izmjene sacuvaju.');

            return;
        }

        $this->info('  Upisano.');

        if ($this->undoPath !== null) {
            $this->line('  Stare vrijednosti: '.$this->undoPath);
        }
    }
}
