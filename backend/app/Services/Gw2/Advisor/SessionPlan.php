<?php

namespace App\Services\Gw2\Advisor;

/**
 * An evening, built out of recommendations that already hold.
 *
 * Nothing new is invented here — that is the whole design. The advisor has
 * already decided what is worth doing and how sure it is; this only orders a
 * subset of it into something that fits the time somebody says they have. A
 * planner that generated its own activities would be a second advisor with no
 * rules behind it.
 *
 * ── About the minutes ───────────────────────────────────────────────────
 *
 * The mockup draws a schedule: 0–10 the vault, 10–20 a fractal, 20–35 a hero
 * point train. Nothing computes those and nothing could — the game does not
 * report how long anything takes and people play at very different speeds.
 *
 * So the estimates are editorial, they live on the rule where an editor can
 * correct them, and they are ranges rather than figures. A rule with no estimate
 * still appears; it simply takes its place in the order without claiming a
 * duration, which is more honest than defaulting it to ten.
 *
 * The budget is filled with the low end of each range. Overrunning somebody's
 * hour is a worse failure than under-filling it: an evening with time left over
 * is a good evening, and one that needed ninety minutes was a plan they could
 * not follow.
 */
class SessionPlan
{
    /** Past this, a plan stops being a plan and becomes a list. */
    private const MOST_STEPS = 6;

    /**
     * @param  array<int, array<string, mixed>>  $candidates  Advisor output, already ranked.
     * @return array<string, mixed>
     */
    public function build(array $candidates, ?int $minutes): array
    {
        $budget = $minutes;
        $spent = 0;
        $steps = [];
        $extra = [];

        foreach ($candidates as $candidate) {
            $low = $candidate['minutes_low'] ?? null;
            $high = $candidate['minutes_high'] ?? null;

            /*
             * Nothing to spend against: no budget stated, or no estimate on the
             * rule. Both mean "take it in order and do not pretend to schedule
             * it", which is different from excluding it.
             */
            $costs = ($budget !== null && $low !== null) ? (int) $low : null;

            if (count($steps) >= self::MOST_STEPS || ($costs !== null && $spent + $costs > $budget)) {
                $extra[] = $this->step($candidate, null, null);

                continue;
            }

            $steps[] = $this->step($candidate, $costs === null ? null : $spent, $costs);

            if ($costs !== null) {
                $spent += $costs;
            }
        }

        return [
            'minutes' => $minutes,
            'steps' => $steps,
            /*
             * Not "rejected" — these are the same recommendations, below the
             * line the time budget drew. Somebody who finishes early or changes
             * their mind should find them rather than an empty page.
             */
            'if_you_have_longer' => array_slice($extra, 0, 4),
            'accounted_for' => $spent,
            /*
             * How much of the stated time the estimates cover. Deliberately
             * reported rather than hidden: a plan that fills eighteen minutes of
             * a stated hour is telling the reader something true about how much
             * we actually know.
             */
            'unaccounted' => $budget !== null ? max(0, $budget - $spent) : null,
            'estimates_are_ours' => true,
        ];
    }

    /**
     * @param  array<string, mixed>  $candidate
     * @return array<string, mixed>
     */
    private function step(array $candidate, ?int $startsAt, ?int $costs): array
    {
        return [
            'key' => $candidate['key'],
            'subject' => $candidate['subject'],
            'domain' => $candidate['domain'],
            'title' => $candidate['title'],
            'body' => $candidate['body'],
            'confidence' => $candidate['confidence'],
            'effort' => $candidate['effort'],
            'blockers' => $candidate['blockers'],
            'minutes_low' => $candidate['minutes_low'] ?? null,
            'minutes_high' => $candidate['minutes_high'] ?? null,
            /*
             * Where in the session it sits, in minutes from the start. Null when
             * the rule carries no estimate — in which case the step is still in
             * the plan and simply has no clock beside it.
             */
            'starts_at' => $startsAt,
            'costs' => $costs,
        ];
    }
}
