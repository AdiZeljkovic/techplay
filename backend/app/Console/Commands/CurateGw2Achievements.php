<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * A first curation pass over 8,339 achievements, from the game's own metadata.
 *
 * §12.1 asks for exactly this — *"Exclude deprecated, hidden, historical or
 * otherwise unsuitable entries through a maintained denylist/metadata layer"* —
 * and it turns out ArenaNet publishes most of the answer in `flags`.
 *
 * This is not judgement. Every rule below reads a flag the game sets:
 *
 *   IgnoreNearlyComplete   the game saying "not a nearly-complete candidate"
 *   Hidden                 §12.1 names it
 *   Daily/Weekly/Monthly   they reset; "one step away" is noise by tomorrow
 *   Repeatable             the same
 *   Pvp                    §6.1 and §26 both defer PvP from this product
 *   RequiresUnlock         §5: never turn a prerequisite we cannot see into
 *                          confidence
 *
 * What is left — a `Permanent` achievement carrying none of those — is approved,
 * because there is nothing in the data suggesting otherwise and the alternative
 * is seven thousand rows nobody will ever hand-review.
 *
 * Anything with no flags at all is left **unreviewed** rather than guessed
 * either way. That is the residue a person should actually look at, and it is a
 * few hundred rows rather than eight thousand.
 *
 * Like the indexable picker, this never touches a row somebody has reviewed.
 */
class CurateGw2Achievements extends Command
{
    protected $signature = 'gw2:curate-achievements
        {--dry : Count what would change and write nothing}
        {--reset : Clear our own previous pass first, keeping human reviews}';

    protected $description = 'Curate Guild Wars 2 achievements from the game\'s own flags';

    /**
     * Flags that take an achievement out, and the word recorded for why.
     *
     * Ordered: the first match wins, so the most specific reason is the one
     * stored. `IgnoreNearlyComplete` leads because it is the game answering
     * this exact question.
     */
    private const EXCLUDE = [
        'IgnoreNearlyComplete' => 'game_says_ignore',
        'Hidden' => 'hidden',
        'Daily' => 'resets_daily',
        'Weekly' => 'resets_weekly',
        'Monthly' => 'resets_monthly',
        'Repeatable' => 'repeatable',
        'Pvp' => 'pvp_deferred',
        'RequiresUnlock' => 'needs_unlock_we_cannot_see',
    ];

    public function handle(): int
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('This pass reads jsonb flags and needs PostgreSQL.');

            return self::FAILURE;
        }

        if ($this->option('reset') && ! $this->option('dry')) {
            $cleared = DB::table('gw2_achievements')
                ->whereNotNull('curation_reason')
                ->update(['advisor_eligible' => false, 'curation_reason' => null, 'reviewed_at' => null]);

            $this->line("Cleared {$cleared} rows from a previous pass. Human reviews are untouched.");
        }

        $counts = [];
        $excluded = [];

        foreach (self::EXCLUDE as $flag => $reason) {
            $ids = $this->withFlag($flag, $excluded);
            $counts[] = [$flag, $reason, number_format(count($ids))];

            if (! $this->option('dry')) {
                $this->apply($ids, false, $reason);
            }

            $excluded = array_merge($excluded, $ids);
        }

        /*
         * Permanent, and none of the above. The ordinary case: a one-off
         * achievement that stays done once it is done.
         */
        $approve = $this->withFlag('Permanent', $excluded);
        $counts[] = ['Permanent', 'approved', number_format(count($approve))];

        if (! $this->option('dry')) {
            $this->apply($approve, true, 'permanent');
        }

        $this->table(['Flag', 'Reason', 'Rows'], $counts);

        $unreviewed = DB::table('gw2_achievements')->whereNull('reviewed_at')->count();

        $this->newLine();

        if ($this->option('dry')) {
            $this->warn('Dry run — nothing written.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            '%s eligible, %s excluded, %s still unreviewed.',
            number_format(DB::table('gw2_achievements')->where('advisor_eligible', true)->count()),
            number_format(DB::table('gw2_achievements')->whereNotNull('reviewed_at')->where('advisor_eligible', false)->count()),
            number_format($unreviewed)
        ));

        /*
         * The residue is the point of the whole exercise. It is what a person
         * should look at, and it should be small enough that they will.
         */
        $this->line("<fg=gray>Those {$unreviewed} carry no flag that decides them. They are the ones worth a person's time — /admin/gw2-achievements, filter by unreviewed.</>");

        return self::SUCCESS;
    }

    /**
     * @param  array<int, int>  $already
     * @return array<int, int>
     */
    private function withFlag(string $flag, array $already): array
    {
        $rows = DB::table('gw2_achievements')
            ->whereNull('reviewed_at')
            ->whereRaw('flags @> ?::jsonb', [json_encode([$flag])])
            ->when($already !== [], fn ($q) => $q->whereNotIn('id', $already))
            ->pluck('id')
            ->all();

        return array_map('intval', $rows);
    }

    /** @param array<int, int> $ids */
    private function apply(array $ids, bool $eligible, string $reason): void
    {
        foreach (array_chunk($ids, 2000) as $chunk) {
            DB::table('gw2_achievements')->whereIn('id', $chunk)->update([
                'advisor_eligible' => $eligible,
                'curation_reason' => $reason,
                'reviewed_at' => now(),
            ]);
        }
    }
}
