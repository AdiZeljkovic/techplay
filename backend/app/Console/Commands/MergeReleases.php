<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Releases\GameMatcher;
use App\Services\Releases\GameMerger;
use App\Services\Releases\Notability;
use Illuminate\Console\Command;

/**
 * Folds duplicate calendar entries together.
 *
 * Run after a sync. Until it does, a game sold in three stores is three entries
 * each claiming the game is exclusive to one platform.
 */
class MergeReleases extends Command
{
    protected $signature = 'releases:merge {--pending : List the pairs waiting on an editor instead of merging}';

    protected $description = 'Fold the same game, arriving from several stores, into one calendar entry';

    public function handle(GameMerger $merger, GameMatcher $matcher, Notability $notability): int
    {
        if ($this->option('pending')) {
            return $this->listPending($merger, $matcher);
        }

        $before = Game::whereNotNull('match_key')->count();

        $tally = $merger->run(function (Game $left, Game $right, string $verdict) {
            if ($verdict === GameMatcher::MERGE) {
                $this->line('  <fg=green>=</> '.mb_strimwidth($left->name, 0, 46, '…').'  ←  '.mb_strimwidth($right->name, 0, 46, '…'));
            }
        });

        $after = Game::whereNotNull('match_key')->count();

        // Entries folded before merging chose between titles kept whichever
        // name was on the older row, often an edition's.
        $retitled = $merger->retitle();

        // How many stores carry a game is the strongest thing we know about how
        // big a release it is, and merging is what settles that — so scoring
        // belongs here rather than in a sync.
        $rescored = $notability->rescore();

        $this->newLine();
        $this->table(
            ['before', 'after', 'merged', 'needs an editor', 'left alone', 'retitled', 'rescored'],
            [[$before, $after, $tally['merged'], $tally['review'], $tally['separate'], $retitled, $rescored]],
        );

        if ($tally['review'] > 0) {
            $this->newLine();
            $this->line("<fg=yellow>{$tally['review']} pairs were too close to call. See them with --pending.</>");
        }

        return self::SUCCESS;
    }

    /**
     * The pairs the rules would not settle alone. Nothing here is a defect —
     * it is the queue working as intended.
     */
    private function listPending(GameMerger $merger, GameMatcher $matcher): int
    {
        $rows = [];

        foreach ($merger->candidates() as [$left, $right]) {
            $verdict = $matcher->verdict(
                ['title' => $left->name, 'released' => $left->released?->toDateString(), 'publisher' => data_get($left->details_data, 'publisher')],
                ['title' => $right->name, 'released' => $right->released?->toDateString(), 'publisher' => data_get($right->details_data, 'publisher')],
            );

            if ($verdict !== GameMatcher::REVIEW) {
                continue;
            }

            $rows[] = [
                mb_strimwidth($left->name, 0, 34, '…'),
                $left->released?->toDateString() ?? '—',
                mb_strimwidth($right->name, 0, 34, '…'),
                $right->released?->toDateString() ?? '—',
                $left->storeLinks->pluck('store')->merge($right->storeLinks->pluck('store'))->unique()->implode(', '),
            ];
        }

        if ($rows === []) {
            $this->info('Nothing is waiting on a decision.');

            return self::SUCCESS;
        }

        $this->table(['title', 'date', 'title', 'date', 'stores'], $rows);
        $this->line('<fg=gray>Rule on these in the admin panel; the answer is remembered.</>');

        return self::SUCCESS;
    }
}
