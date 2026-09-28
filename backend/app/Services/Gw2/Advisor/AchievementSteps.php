<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * Turns the catalogue's step list and an account's ticked indices into steps.
 *
 * Two callers want this and they want it for different reasons. The snapshot
 * reader wants it for six nearly-done achievements so a recommendation can say
 * what is left; a mount guide wants it for twenty collections at once so the
 * page can show a chain. Neither wants sixty item lookups, which is why the
 * names are resolved for the whole batch in the constructor rather than per
 * achievement.
 *
 * Build one per batch and throw it away. It holds the item names for the
 * achievements it was given and nothing else, so reusing it across batches
 * would quietly return steps with missing names.
 */
class AchievementSteps
{
    /** @var array<int, array<int, array<string, mixed>>> */
    private array $bits = [];

    /** @var array<int, string> */
    private array $itemNames = [];

    /**
     * @param  iterable<object>  $catalogue  Rows carrying `id` and `bits`.
     */
    public function __construct(iterable $catalogue)
    {
        $ids = [];

        foreach ($catalogue as $row) {
            $bits = $this->decode($row->bits ?? null);
            $this->bits[(int) $row->id] = $bits;

            foreach ($bits as $bit) {
                if (($bit['type'] ?? null) === 'Item' && ! ($bit['text'] ?? null) && isset($bit['id'])) {
                    $ids[] = (int) $bit['id'];
                }
            }
        }

        /*
         * Most `Item` steps carry their own text and need nothing from here.
         * The rest name an item id and leave the wording to whoever renders,
         * which without this batch would be one query per step.
         */
        if ($ids !== []) {
            $this->itemNames = DB::table('gw2_items')
                ->whereIn('id', array_unique($ids))
                ->pluck('name', 'id')
                ->all();
        }
    }

    /**
     * The step list for one achievement, with this account's progress on it.
     *
     * `$done` is the account's list of completed indices and the catalogue's
     * `bits` is an ordered list, so position is the join: step three is
     * `bits[2]` and is done when 2 appears in `$done`. Worth stating because
     * it is also the one thing that could break quietly — if ArenaNet ever
     * reordered a `bits` array between builds, stored progress would point at
     * the wrong steps. They have not, the catalogue refreshes nightly and the
     * account is read against the same build, but a reorder is what to suspect
     * if a walkthrough ever reads as nonsense.
     *
     * Returns an empty array where the achievement has no step list at all — a
     * counter like "kill 1,000 centaurs" has a number and no steps, which is a
     * different thing from a step list we failed to read.
     *
     * @param  array<int, int>  $done
     * @return array<int, AchievementStep>
     */
    public function for(int $achievementId, array $done): array
    {
        $bits = $this->bits[$achievementId] ?? [];

        if ($bits === []) {
            return [];
        }

        $ticked = array_flip($done);
        $steps = [];

        foreach ($bits as $index => $bit) {
            $text = $this->text($bit['text'] ?? null);

            if ($text === null && ($bit['type'] ?? null) === 'Item' && isset($bit['id'])) {
                $text = $this->itemNames[(int) $bit['id']] ?? null;
            }

            $steps[] = new AchievementStep(
                index: $index,
                text: $text,
                done: isset($ticked[$index]),
            );
        }

        return $steps;
    }

    /** @return array<int, array<string, mixed>> */
    private function decode(mixed $value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;

        return is_array($decoded) ? array_values($decoded) : [];
    }

    /** Trim to null, so an empty string never renders as a named step. */
    private function text(mixed $value): ?string
    {
        $trimmed = is_string($value) ? trim($value) : '';

        return $trimmed === '' ? null : $trimmed;
    }
}
