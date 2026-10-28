<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * What resets today and this week, how much of it is done, and when it goes.
 *
 * Every list here is a window the game forgets at reset: world bosses, Hero's
 * Choice chests, time-gated crafts and dungeon paths at 00:00 UTC, raid clears
 * on Monday at 07:30 UTC. The account endpoints say what is done inside the
 * window; the catalogue says what there is. The countdown is the part neither
 * of them gives, and the part that turns a list into something to act on.
 *
 * Two of the game's own lists are known to be short, and the payload says so
 * rather than presenting them as complete: `/v2/mapchests` has nineteen chests
 * and none from Janthir Wilds or Visions of Eternity (checked 29 October 2026 —
 * whether those maps have such chests at all is not established), and
 * `/v2/raids` stops before the newest encounters.
 */
class DailyChecklist
{
    /**
     * @return array<string, mixed>
     */
    public function for(Snapshot $snapshot): array
    {
        $state = DB::table('gw2_account_state')
            ->where('gw2_account_id', $snapshot->accountId)
            ->first(['map_chests', 'daily_crafting']);

        $chestsDone = $state?->map_chests !== null ? (json_decode($state->map_chests, true) ?: []) : null;
        $craftedDone = $state?->daily_crafting !== null ? (json_decode($state->daily_crafting, true) ?: []) : null;

        $bosses = $this->ids('worldbosses');
        $chests = $this->ids('mapchests');
        $crafts = $this->ids('dailycrafting');

        /*
         * The resets that close the window this read belongs to — counted from
         * when the account was read, not from when this payload was built. A
         * dashboard cached across midnight would otherwise show the evening's
         * ticks under a countdown to the *next* midnight, as if they were today's.
         */
        $readAt = $snapshot->observedAt ? Carbon::parse($snapshot->observedAt) : now();

        return [
            'daily_reset_at' => self::nextDailyReset($readAt)->toIso8601String(),
            'weekly_reset_at' => self::nextWeeklyReset($readAt)->toIso8601String(),
            'daily' => [
                'world_bosses' => [
                    'done' => count(array_intersect($snapshot->bossesToday, $bosses)),
                    'total' => count($bosses),
                ],
                // Null when the account has never been read for chests — a key
                // without `progression`, or a read from before the endpoint was
                // added — which is not the same as none taken.
                'heros_choice_chests' => $chestsDone === null ? null : [
                    'done' => count(array_intersect($chestsDone, $chests)),
                    'total' => count($chests),
                    'items' => array_map(fn ($id) => [
                        'id' => $id,
                        'name' => ContentProgress::humanise(preg_replace('/_heros_choice_chest$/', '', $id)),
                        'done' => in_array($id, $chestsDone, true),
                    ], $chests),
                ],
                'time_gated_crafts' => $craftedDone === null ? null : [
                    'done' => count(array_intersect($craftedDone, $crafts)),
                    'total' => count($crafts),
                    'items' => array_map(fn ($id) => [
                        'id' => $id,
                        'name' => ContentProgress::humanise($id),
                        'done' => in_array($id, $craftedDone, true),
                    ], $crafts),
                ],
                'dungeon_paths' => count($snapshot->dungeonPathsToday),
            ],
            'weekly' => [
                'raid_encounters' => count($snapshot->raidsThisWeek),
            ],
            'notes' => [
                [
                    'text' => "The game's list of Hero's Choice chests has 19 maps and none from Janthir Wilds or Visions of Eternity, so chests there are not counted.",
                    'source' => 'https://api.guildwars2.com/v2/mapchests?ids=all',
                ],
                [
                    'text' => "The game's raid list stops before the newest encounters, so recent ones are not counted.",
                    'source' => 'https://github.com/gw2-api/issues/issues/148',
                ],
            ],
        ];
    }

    /** 00:00 UTC, every day. */
    public static function nextDailyReset(?Carbon $now = null): Carbon
    {
        return ($now ?? now())->copy()->utc()->startOfDay()->addDay();
    }

    /** Monday 07:30 UTC. */
    public static function nextWeeklyReset(?Carbon $now = null): Carbon
    {
        $now = ($now ?? now())->copy()->utc();
        $reset = $now->copy()->startOfWeek(Carbon::MONDAY)->setTime(7, 30);

        return $reset->lessThanOrEqualTo($now) ? $reset->addWeek() : $reset;
    }

    /** @return array<int, string> */
    private function ids(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->orderBy('name')
            ->pluck('payload')
            ->map(fn ($p) => (string) (json_decode($p, true)['id'] ?? ''))
            ->filter()
            ->values()
            ->all();
    }
}
