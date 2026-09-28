<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Goal;
use Illuminate\Support\Facades\DB;

/**
 * What the player has told us, as against what ArenaNet has.
 *
 * Three kinds of thing, and they share a class because they share a property:
 * none of them can be read from the game, all of them change what the advisor
 * should say, and every one of them has to stay distinguishable from a fact.
 *
 * Pins persist a goal past the tab closing (§21). The featured character
 * overrides a guess we would otherwise keep making (§26.2). Confirmations
 * answer the questions the API cannot (§17.3) — and are recorded with a
 * `source` so that a later reader cannot mistake somebody's own claim for
 * something the game said.
 */
class PlayerChoices
{
    /**
     * Goals this account is working on, highest priority first.
     *
     * @return array<int, array<string, mixed>>
     */
    public function pins(int $gw2AccountId): array
    {
        return DB::table('gw2_user_goals')
            ->join('gw2_goals', 'gw2_goals.id', '=', 'gw2_user_goals.gw2_goal_id')
            ->where('gw2_user_goals.gw2_account_id', $gw2AccountId)
            ->whereNull('gw2_user_goals.completed_at')
            ->orderByDesc('gw2_user_goals.priority')
            ->orderBy('gw2_goals.sort_order')
            ->get([
                'gw2_goals.slug',
                'gw2_goals.title',
                'gw2_goals.summary',
                'gw2_goals.domain',
                'gw2_user_goals.character_name',
                'gw2_user_goals.priority',
                'gw2_user_goals.created_at as pinned_at',
            ])
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    /**
     * The goal to assume when the player has not said one for this request.
     *
     * Their top pin. This is the whole point of pinning — somebody who said
     * last week that they are working towards fractals should not have to say
     * it again every time they open the page.
     */
    public function defaultGoal(int $gw2AccountId): ?string
    {
        return $this->pins($gw2AccountId)[0]['slug'] ?? null;
    }

    /**
     * Pin a goal. Pinning one already pinned raises it instead of failing.
     */
    public function pin(int $gw2AccountId, string $slug, ?string $characterName = null): bool
    {
        $goal = Gw2Goal::query()->active()->firstWhere('slug', $slug);

        if (! $goal) {
            return false;
        }

        // The newest pin leads. Somebody pinning a second goal is usually
        // telling us the emphasis moved, not that they want an older one first.
        $top = (int) DB::table('gw2_user_goals')->where('gw2_account_id', $gw2AccountId)->max('priority');

        DB::table('gw2_user_goals')->updateOrInsert(
            ['gw2_account_id' => $gw2AccountId, 'gw2_goal_id' => $goal->id],
            [
                'character_name' => $characterName,
                'priority' => $top + 1,
                'completed_at' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return true;
    }

    public function unpin(int $gw2AccountId, string $slug): void
    {
        $goalId = Gw2Goal::where('slug', $slug)->value('id');

        if ($goalId) {
            DB::table('gw2_user_goals')
                ->where('gw2_account_id', $gw2AccountId)
                ->where('gw2_goal_id', $goalId)
                ->delete();
        }
    }

    /**
     * Everything this account has answered, keyed by subject.
     *
     * @return array<string, array<string, mixed>>
     */
    public function confirmations(int $gw2AccountId): array
    {
        return DB::table('gw2_confirmations')
            ->where('gw2_account_id', $gw2AccountId)
            ->get(['subject', 'answer', 'source', 'note', 'updated_at'])
            ->keyBy('subject')
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    /**
     * Record an answer to something the API cannot see.
     *
     * `unsure` is a real answer and is stored like any other. It stops the
     * question being asked again next week, which is the difference between a
     * tool that listens and one that nags.
     */
    public function confirm(int $gw2AccountId, string $subject, string $answer, ?string $note = null): bool
    {
        if (! in_array($answer, ['yes', 'no', 'unsure'], true)) {
            return false;
        }

        DB::table('gw2_confirmations')->updateOrInsert(
            ['gw2_account_id' => $gw2AccountId, 'subject' => $subject],
            [
                'answer' => $answer,
                // Always the player, recorded anyway. The day something else
                // writes here, the difference has to already be in the data.
                'source' => 'player',
                'note' => $note,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return true;
    }

    /**
     * The questions worth asking this account, and what it has answered.
     *
     * Only one so far, and it is the document's own example (§5, §11.1):
     * `/characters/:id/training` is documented as returning empty in all cases,
     * so an elite specialisation slotted in a build proves it is usable and
     * proves nothing about whether the track is finished. The honest options
     * are to say nothing or to ask.
     *
     * @return array<int, array<string, mixed>>
     */
    public function openQuestions(Snapshot $snapshot): array
    {
        $answered = $this->confirmations($snapshot->accountId);
        $questions = [];

        foreach ($snapshot->characters as $character) {
            if ($character->level < 80) {
                continue;
            }

            $subject = "elite_spec:{$character->name}";

            $questions[] = [
                'subject' => $subject,
                'question' => "Have you finished the elite specialisation training on {$character->name}?",
                'why' => 'The game\'s own training endpoint returns nothing, so we cannot tell a slotted '
                    .'elite specialisation from a fully trained one.',
                'answer' => $answered[$subject]['answer'] ?? null,
                'answered_at' => $answered[$subject]['updated_at'] ?? null,
            ];
        }

        return $questions;
    }
}
