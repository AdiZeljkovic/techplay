<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Igdb\IgdbFacts;
use App\Services\Igdb\IgdbMatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Writes IGDB's data into our games — only where ours is empty.
 *
 * The rule that shapes everything here: **it fills, it does not replace.** A
 * column we already have a value for is left exactly as it is, whatever IGDB
 * thinks. That makes the merge safe to run twice, safe to run while somebody is
 * editing, and impossible to use as a way of losing work — which matters more
 * than any of the data it adds, because the data can be fetched again and an
 * overwritten description cannot.
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
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Popunjava prazna polja nasih igara IGDB podacima (bez --apply samo pregleda)';

    /** What this round can fill, given what has been pulled so far. */
    private const FIELDS = ['description', 'cover_url', 'videos', 'developers', 'publishers', 'alt_titles', 'series_key', 'series_name', 'released'];

    public function handle(IgdbMatcher $matcher, IgdbFacts $facts): int
    {
        if (! DB::table('igdb_game_keys')->exists()) {
            $this->error('igdb_game_keys je prazna — pokreni prvo igdb:index.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

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
        $touched = 0;
        $locked = 0;

        foreach ($matched as [$game, $igdbId, $rule]) {
            $available = $facts->forGame($igdbId);
            $lockedHere = (array) ($game->locked_fields ?? []);
            $updates = [];

            foreach (self::FIELDS as $field) {
                if (! array_key_exists($field, $available)) {
                    continue;
                }

                if (in_array($field, $lockedHere, true)) {
                    $locked++;

                    continue;
                }

                if (! $this->isEmpty($game->{$field})) {
                    continue;   // ours stays
                }

                $updates[$field] = $available[$field];
            }

            if ($updates === []) {
                continue;
            }

            $touched++;
            foreach (array_keys($updates) as $field) {
                $filled[$field]++;
            }

            if ($apply) {
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

        $this->report($ours->count(), count($matched), $touched, $filled, $locked, $apply);

        return self::SUCCESS;
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

    private function report(int $sampled, int $matched, int $touched, array $filled, int $locked, bool $apply): void
    {
        $this->newLine();
        $this->line(sprintf(
            '  Uzorak %s — pouzdano spojeno %s, izmijenjeno %s',
            number_format($sampled), number_format($matched), number_format($touched)
        ));
        $this->newLine();

        $rows = [];
        foreach ($filled as $field => $n) {
            if ($n > 0) {
                $rows[] = [$field, number_format($n)];
            }
        }

        $this->table(['polje', $apply ? 'popunjeno' : 'bilo bi popunjeno'], $rows ?: [['—', '0']]);

        if ($locked > 0) {
            $this->line('  '.number_format($locked).' polja preskoceno jer su zakljucana (locked_fields).');
        }

        $this->newLine();
        if ($apply) {
            $this->info('  Upisano. Postojece vrijednosti nisu dirane — popunjena su samo prazna polja.');
        } else {
            $this->warn('  Nista nije upisano. Dodaj --apply da se izmjene sacuvaju.');
        }
    }
}
