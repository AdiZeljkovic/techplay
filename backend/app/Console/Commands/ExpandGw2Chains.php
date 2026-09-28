<?php

namespace App\Console\Commands;

use App\Models\Gw2Guide;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Expands a guide's achievement chain using the game's own step text.
 *
 * A person lists the spine — the five collections the Skyscale hangs off, the
 * three stages of the Siege Turtle. That list is the curated part, and it has
 * to be, because the API does not carry it: `prerequisites` is set on one of
 * the forty Skyscale achievements, and the collections sit in the "War Eternal"
 * category beside thirty-one unrelated things.
 *
 * What the API *does* carry, once you store `bits`, is each spine step naming
 * its own children in plain words:
 *
 * > Newborn Skyscales — "Complete the Skyscale Scales collection." · "Complete
 * > the Skyscale Medicine collection." · "Complete the Skyscale Fever
 * > collection." · "Complete the Skyscale Eggs collection."
 *
 * So the spine is curated and the twenty-four collections hanging off it are
 * derived. That is the right division: a person maintains six ids, not thirty,
 * and the thirty stay correct through a patch that would have stranded a
 * hand-typed list.
 *
 * Deliberately manual, not nightly. It rewrites editorial data, and a command
 * that rewrites editorial data on a timer is one that will one day undo
 * somebody's correction at three in the morning. Run it, read the diff it
 * prints, keep it or do not.
 */
class ExpandGw2Chains extends Command
{
    protected $signature = 'gw2:expand-chains
                            {--guide= : One guide, as family/slug. Default is every guide with a chain.}
                            {--write : Save. Without it this only reports what it would do.}';

    protected $description = "Expand a guide's achievement chain using the collections its own steps name";

    /**
     * "Complete the Skyscale Scales collection." and its variants.
     *
     * Anchored at the start so a step merely mentioning a collection in
     * passing is not mistaken for a requirement to finish one.
     */
    private const NAMES_A_COLLECTION = '/^Complete (?:the )?(.+?)(?: collection)?\.?$/i';

    public function handle(): int
    {
        $guides = Gw2Guide::query()
            ->whereNotNull('achievement_ids')
            ->when($this->option('guide'), function ($query, $path) {
                [$family, $slug] = array_pad(explode('/', $path, 2), 2, null);

                $query->where('family', $family)->where('slug', $slug);
            })
            ->get();

        if ($guides->isEmpty()) {
            $this->warn('No guide has a chain to expand.');

            return self::SUCCESS;
        }

        $byName = $this->achievementsByName();

        foreach ($guides as $guide) {
            $this->expand($guide, $byName);
        }

        if (! $this->option('write')) {
            $this->newLine();
            $this->comment('Nothing saved. Add --write once the list above reads right.');
        }

        return self::SUCCESS;
    }

    /**
     * @param  array<string, int>  $byName
     */
    private function expand(Gw2Guide $guide, array $byName): void
    {
        $spine = array_values(array_map('intval', (array) $guide->achievement_ids));

        $steps = DB::table('gw2_achievements')
            ->whereIn('id', $spine)
            ->pluck('bits', 'id')
            ->all();

        $names = DB::table('gw2_achievements')
            ->whereIn('id', $spine)
            ->pluck('name', 'id')
            ->all();

        $chain = [];
        $added = 0;

        foreach ($spine as $id) {
            /*
             * Dedupe as we go, first occurrence winning. That is what makes a
             * second run a no-op rather than a list with every child in it
             * twice — and a second run is exactly what happens when somebody
             * adds one collection to a spine that has already been expanded.
             */
            if (! in_array($id, $chain, true)) {
                $chain[] = $id;
            }

            foreach ($this->named($steps[$id] ?? null, $byName) as $childId) {
                if (! in_array($childId, $chain, true)) {
                    $chain[] = $childId;
                    $added++;
                }
            }
        }

        $this->line('');
        $this->info("{$guide->family}/{$guide->slug} — ".count($spine)." listed, {$added} derived, ".count($chain).' in all');

        $allNames = $names + DB::table('gw2_achievements')
            ->whereIn('id', $chain)
            ->pluck('name', 'id')
            ->all();

        foreach ($chain as $id) {
            $isSpine = in_array($id, $spine, true);
            $this->line(sprintf(
                '  %s %-7d %s',
                $isSpine ? '▸' : ' └',
                $id,
                $allNames[$id] ?? '(not in the catalogue)'
            ));
        }

        if ($this->option('write')) {
            /*
             * `reviewed_at` is cleared on purpose. The page now says something
             * nobody has read, and the guide table treats an unreviewed row as
             * exactly that.
             */
            $guide->forceFill(['achievement_ids' => $chain, 'reviewed_at' => null])->save();
        }
    }

    /**
     * The collections a step list asks you to finish.
     *
     * @return array<int, int>
     */
    private function named(mixed $bits, array $byName): array
    {
        $decoded = is_string($bits) ? json_decode($bits, true) : $bits;
        $found = [];

        foreach ((array) $decoded as $bit) {
            $text = trim((string) ($bit['text'] ?? ''));

            if ($text === '' || ! preg_match(self::NAMES_A_COLLECTION, $text, $match)) {
                continue;
            }

            $id = $byName[mb_strtolower(trim($match[1]))] ?? null;

            /*
             * A name that matches nothing is skipped in silence. "Complete the
             * story." matches the shape and names no collection, and treating
             * that as a broken reference would bury the real output in noise.
             */
            if ($id !== null) {
                $found[] = $id;
            }
        }

        return $found;
    }

    /**
     * @return array<string, int>
     */
    private function achievementsByName(): array
    {
        return DB::table('gw2_achievements')
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [mb_strtolower($name) => (int) $id])
            ->all();
    }
}
