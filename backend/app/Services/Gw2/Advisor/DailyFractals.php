<?php

namespace App\Services\Gw2\Advisor;

use App\Services\Gw2\Gw2Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Today's fractals, and tomorrow's.
 *
 * The game publishes them as the "Daily Fractals" achievement category, which
 * changes at 00:00 UTC. Read with the current schema, `/v2/achievements/
 * categories/88` answers both lists — `achievements` for today and `tomorrow`
 * for the next day (checked 28 October 2026). The catalogue copy of the same
 * category is useless for this: it is read once per game build, so it holds
 * whatever day the patch landed on.
 *
 * One public request a day, made by `gw2:daily-fractals` just after the reset
 * and stored, so a page view never reaches ArenaNet. If that read is missed,
 * yesterday's `tomorrow` is today — the page does not go blank for a day
 * because of one failed request.
 *
 * Names are the achievements' own: "Daily Tier 4 Aetherblade", "Daily
 * Recommended Fractal—Scale 28". They are grouped by reading that pattern; a
 * name that does not fit it is shown as it is rather than dropped.
 */
class DailyFractals
{
    public const CATEGORY = 88;

    private const KIND = 'daily_fractals';

    /** Read the lists and store them. Returns how many ids today has. */
    public function refresh(Gw2Client $api, ?Carbon $now = null): int
    {
        $category = $api->public('achievements/categories/'.self::CATEGORY, ['v' => 'latest']);

        $ids = fn (string $key) => array_values(array_filter(array_map(
            // The current schema gives objects, the old one bare ids.
            fn ($row) => (int) (is_array($row) ? ($row['id'] ?? 0) : $row),
            (array) ($category[$key] ?? [])
        )));

        $today = $ids('achievements');

        DB::table('gw2_reference')->updateOrInsert(
            ['kind' => self::KIND, 'ref_id' => self::CATEGORY],
            [
                'name' => 'Daily Fractals',
                'payload' => json_encode([
                    'for_date' => ($now ?? now())->copy()->utc()->toDateString(),
                    'today' => $today,
                    'tomorrow' => $ids('tomorrow'),
                    'read_at' => ($now ?? now())->toIso8601String(),
                ]),
            ]
        );

        return count($today);
    }

    /**
     * Today's and tomorrow's lists, or null when nothing current is stored.
     *
     * @return array<string, mixed>|null
     */
    public function read(?Carbon $now = null): ?array
    {
        $payload = json_decode((string) DB::table('gw2_reference')
            ->where('kind', self::KIND)
            ->where('ref_id', self::CATEGORY)
            ->value('payload'), true);

        if (! is_array($payload) || ! isset($payload['for_date'])) {
            return null;
        }

        $date = ($now ?? now())->copy()->utc()->startOfDay();
        $stored = Carbon::parse($payload['for_date'], 'UTC')->startOfDay();

        if ($stored->equalTo($date)) {
            [$today, $tomorrow] = [$payload['today'] ?? [], $payload['tomorrow'] ?? []];
        } elseif ($stored->copy()->addDay()->equalTo($date) && ($payload['tomorrow'] ?? []) !== []) {
            // Last night's read missed; yesterday's "tomorrow" is today.
            [$today, $tomorrow] = [$payload['tomorrow'], []];
        } else {
            return null;
        }

        $names = DB::table('gw2_achievements')
            ->whereIn('id', array_merge($today, $tomorrow))
            ->pluck('name', 'id');

        return [
            'date' => $date->toDateString(),
            'today' => $this->group($today, $names->all()),
            'tomorrow' => $tomorrow === [] ? null : $this->group($tomorrow, $names->all()),
            'resets_at' => DailyChecklist::nextDailyReset($now)->toIso8601String(),
            'read_at' => $payload['read_at'] ?? null,
        ];
    }

    /**
     * The day's list as the game's own fractal journal would show it: each
     * fractal with the tiers it counts on, then the recommended scales.
     *
     * @param  array<int, int>  $ids
     * @param  array<int, string>  $names
     * @return array{fractals: array<int, array{name: string, tiers: array<int, int>}>, recommended: array<int, int>, other: array<int, string>}
     */
    private function group(array $ids, array $names): array
    {
        $fractals = [];
        $recommended = [];
        $other = [];

        foreach ($ids as $id) {
            $name = $names[$id] ?? null;

            if ($name === null) {
                $other[] = "Achievement #{$id}";
            } elseif (preg_match('/^Daily Tier (\d) (.+)$/u', $name, $m)) {
                $fractals[$m[2]][] = (int) $m[1];
            } elseif (preg_match('/^Daily Recommended Fractal\W+Scale (\d+)$/u', $name, $m)) {
                $recommended[] = (int) $m[1];
            } else {
                $other[] = $name;
            }
        }

        sort($recommended);

        return [
            'fractals' => array_map(function (string $name, array $tiers) {
                sort($tiers);

                return ['name' => $name, 'tiers' => $tiers];
            }, array_keys($fractals), array_values($fractals)),
            'recommended' => $recommended,
            'other' => $other,
        ];
    }
}
