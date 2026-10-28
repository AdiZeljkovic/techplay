<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Guide;
use App\Services\Gw2\Wiki;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The achievements page: points, the game's own groups and categories with how
 * far along each is, what is closest to done, and what was finished lately.
 *
 * The mockup's menu has the page and draws nothing on it, so this follows the
 * game's own achievement panel — groups, then categories — because that is
 * the map a player already carries.
 *
 * **Points** are summed, not read: the API has no total. Every tier the account
 * has reached, repeatable achievements up to their cap, and the daily and
 * monthly points `/v2/account` reports separately. Repeats whose cap our
 * catalogue does not hold yet are counted once, and the payload says how many.
 *
 * **Counts** leave out what resets — daily, weekly and monthly achievements are
 * a different list every day — and hidden achievements not yet done, which the
 * game itself does not show until they are. The Historical group can no longer
 * be completed, so it reports what was done and no denominator.
 */
class Achievements
{
    /** Achievements that are a different list every reset. */
    private const RESETTING = ['Daily', 'Weekly', 'Monthly'];

    /** The game's group GUIDs. Stable across builds, unlike their order. */
    public const HISTORICAL = 'A9F7378E-9C8A-48CC-9505-3094E661D5F6';

    public const FRACTALS = '4E6A6CE7-B131-40BB-81A3-235CDBACDAA9';

    private const WEEKS = 6;

    /** @return array<string, mixed> */
    public function for(Snapshot $snapshot): array
    {
        $rows = $this->accountRows($snapshot->accountId);
        $catalogue = $this->catalogue();

        $account = DB::table('gw2_accounts')->where('id', $snapshot->accountId)->first(['daily_ap', 'monthly_ap']);
        $points = $this->points($rows, $catalogue);

        return [
            'points' => [
                'total' => $points['earned'] + (int) ($account->daily_ap ?? 0) + (int) ($account->monthly_ap ?? 0),
                'from_achievements' => $points['earned'],
                'daily' => $account->daily_ap !== null ? (int) $account->daily_ap : null,
                'monthly' => $account->monthly_ap !== null ? (int) $account->monthly_ap : null,
                // Repeatable achievements done more than once whose cap the
                // catalogue does not hold yet: counted once, not left out.
                'repeats_uncapped' => $points['uncapped'],
            ],
            'done' => count(array_filter($rows, fn ($row) => $this->isDone($row) && ! $this->resets($catalogue[$row['id']] ?? null))),
            'groups' => $this->groups($rows, $catalogue),
            'closest' => array_map([self::class, 'win'], array_slice($snapshot->nearlyDone, 0, 12)),
            'nearly_done' => count($snapshot->nearlyDone),
            'recent' => $this->recent($snapshot->accountId, $catalogue),
            'titles' => app(Collections::class)->titlesWithinReach($snapshot->accountId),
            'guides' => Gw2Guide::listedIn('achievements'),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * One group's categories with the account's place in each — for a page
     * about one part of the game, like fractals.
     *
     * @return array<string, mixed>|null
     */
    public function group(int $gw2AccountId, string $groupId): ?array
    {
        $rows = $this->accountRows($gw2AccountId);

        foreach ($this->groups($rows, $this->catalogue()) as $group) {
            if ($group['id'] === $groupId) {
                return $group;
            }
        }

        return null;
    }

    /**
     * Every achievement id in one group, for filtering a list by it.
     *
     * @return array<int, int>
     */
    public function idsInGroup(string $groupId): array
    {
        $group = $this->reference('achievements_groups')[$groupId] ?? null;
        $categories = $this->reference('achievements_categories');
        $ids = [];

        foreach ((array) ($group['categories'] ?? []) as $categoryId) {
            foreach ((array) ($categories[$categoryId]['achievements'] ?? []) as $id) {
                $ids[] = (int) $id;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * One nearly-done achievement as a card shows it. Shared with the
     * dashboard's easy wins, so the two cannot drift apart.
     *
     * @return array<string, mixed>
     */
    public static function win(EasyWin $w): array
    {
        return [
            'id' => $w->id,
            'name' => $w->name,
            'requirement' => $w->requirement,
            'current' => $w->current,
            'max' => $w->max,
            'remaining' => $w->remaining(),
            // Says plainly whether a human has looked at this row. Some
            // achievements are seasonal or retired and the API does not say
            // which.
            'reviewed' => $w->curated,
            'effort' => $w->effortBand,
            'icon' => $w->icon,
            // What finishing pays, for the reward column of the easy-wins
            // list: points from the catalogue's tiers, and a mastery point
            // where the achievement's rewards name a region.
            'points' => $w->points,
            // The account's spelling (Heart of Thorns), not the catalogue's (Maguuma).
            'mastery_region' => MasteryRegions::toAccountName($w->masteryRegion),
            'wiki' => Wiki::named($w->name),
            // Only what is left, and only where the game named it. A list
            // of three things beats a bar at 94% every time.
            'steps_remaining' => array_values(array_filter(array_map(
                fn ($step) => $step->text,
                $w->remainingSteps()
            ))),
        ];
    }

    /**
     * Points one achievement has paid this account.
     *
     * Tiers are cumulative thresholds, so every tier at or under the current
     * count is banked. A repeatable one pays its whole ladder each time round,
     * up to its cap; `repeated` counts the completions.
     *
     * @param  array{tiers: array<int, array{count: int, points: int}>, flags: array<int, string>, cap: ?int}  $meta
     * @param  array<string, mixed>  $row
     * @return array{0: int, 1: bool} points, and whether a cap was missing
     */
    public static function earned(array $meta, array $row): array
    {
        $ladder = array_sum(array_column($meta['tiers'], 'points'));
        $current = (int) ($row['current'] ?? 0);
        $reached = 0;

        foreach ($meta['tiers'] as $tier) {
            if ($current >= (int) $tier['count']) {
                $reached += (int) $tier['points'];
            }
        }

        if (in_array('Repeatable', $meta['flags'], true) && isset($row['repeated'])) {
            if ($meta['cap'] === null) {
                return [$ladder, (int) $row['repeated'] > 1 || $reached > 0];
            }

            return [min($meta['cap'], (int) $row['repeated'] * $ladder + $reached), false];
        }

        return [($row['done'] ?? false) ? $ladder : $reached, false];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array{earned: int, uncapped: int}
     */
    private function points(array $rows, array $catalogue): array
    {
        $earned = 0;
        $uncapped = 0;

        foreach ($rows as $row) {
            $meta = $catalogue[$row['id']] ?? null;

            // Daily and monthly points are what `daily_ap` and `monthly_ap`
            // already count; adding them here would count them twice.
            if (! $meta || array_intersect(['Daily', 'Monthly'], $meta['flags']) !== []) {
                continue;
            }

            [$points, $missingCap] = self::earned($meta, $row);
            $earned += $points;
            $uncapped += (int) $missingCap;
        }

        return ['earned' => $earned, 'uncapped' => $uncapped];
    }

    /**
     * The game's groups, in its order, each with its categories.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array<int, array<string, mixed>>
     */
    private function groups(array $rows, array $catalogue): array
    {
        $categories = $this->reference('achievements_categories');
        $groups = $this->reference('achievements_groups');

        uasort($groups, fn ($a, $b) => [(int) ($a['order'] ?? 0), $a['name'] ?? ''] <=> [(int) ($b['order'] ?? 0), $b['name'] ?? '']);

        $out = [];

        foreach ($groups as $group) {
            $retired = $group['id'] === self::HISTORICAL;
            $list = [];

            foreach ((array) ($group['categories'] ?? []) as $categoryId) {
                $category = $categories[$categoryId] ?? null;

                if (! $category) {
                    continue;
                }

                $done = 0;
                $total = 0;
                $points = 0;

                foreach ((array) ($category['achievements'] ?? []) as $id) {
                    $meta = $catalogue[(int) $id] ?? null;

                    if (! $meta || $this->resets($meta)) {
                        continue;
                    }

                    $row = $rows[(int) $id] ?? null;
                    $isDone = $row && $this->isDone($row);

                    if (! $isDone && in_array('Hidden', $meta['flags'], true)) {
                        continue;
                    }

                    $total++;
                    $done += (int) $isDone;
                    $points += $row ? self::earned($meta, $row)[0] : 0;
                }

                if ($total === 0 || ($retired && $done === 0)) {
                    continue;
                }

                $list[] = [
                    'id' => (int) $category['id'],
                    'name' => $category['name'] ?? null,
                    'icon' => $category['icon'] ?? null,
                    'order' => (int) ($category['order'] ?? 0),
                    'done' => $done,
                    'total' => $retired ? null : $total,
                    'points' => $points,
                ];
            }

            if ($list === []) {
                continue;
            }

            usort($list, fn ($a, $b) => [$a['order'], $a['name']] <=> [$b['order'], $b['name']]);

            $out[] = [
                'id' => $group['id'],
                'name' => $group['name'] ?? null,
                'description' => ($group['description'] ?? '') ?: null,
                'retired' => $retired,
                'done' => array_sum(array_column($list, 'done')),
                'total' => $retired ? null : array_sum(array_column($list, 'total')),
                'points' => array_sum(array_column($list, 'points')),
                'icon' => $list[0]['icon'],
                'categories' => array_map(fn ($c) => array_diff_key($c, ['order' => true]), $list),
            ];
        }

        return $out;
    }

    /**
     * Achievements finished between two of our reads, newest first, and how
     * many a game week.
     *
     * Only the crossing into done is recorded, by the sync, from the day the
     * account connected. Resetting achievements are left out: a daily done
     * every day is not news.
     *
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array<string, mixed>
     */
    private function recent(int $gw2AccountId, array $catalogue): array
    {
        $events = DB::table('gw2_progress_events')
            ->where('gw2_account_id', $gw2AccountId)
            ->where('type', 'achievement_completed')
            ->where('occurred_at', '>=', DailyChecklist::lastWeeks(self::WEEKS)[0][0])
            ->orderByDesc('occurred_at')
            ->limit(1000)
            ->get(['payload', 'occurred_at'])
            ->map(fn ($e) => ['id' => (int) (json_decode($e->payload, true)['id'] ?? 0), 'occurred_at' => (string) $e->occurred_at])
            ->filter(fn ($e) => isset($catalogue[$e['id']]) && ! $this->resets($catalogue[$e['id']]))
            ->values();

        $categoryIcons = DB::table('gw2_reference')
            ->where('kind', 'achievements_categories')
            ->pluck('payload', 'ref_id')
            ->map(fn ($p) => json_decode($p, true)['icon'] ?? null);

        $weeks = array_map(fn (array $week) => [
            'starts_at' => $week[0]->toIso8601String(),
            'count' => $events->filter(function ($e) use ($week) {
                $at = Carbon::parse($e['occurred_at']);

                return $at->greaterThanOrEqualTo($week[0]) && $at->lessThan($week[1]);
            })->count(),
        ], DailyChecklist::lastWeeks(self::WEEKS));

        return [
            'weeks' => $weeks,
            'this_week' => $weeks[count($weeks) - 1]['count'],
            'events' => $events->take(10)->map(function ($e) use ($catalogue, $categoryIcons) {
                $meta = $catalogue[$e['id']];

                return [
                    'id' => $e['id'],
                    'name' => $meta['name'],
                    'icon' => $meta['icon'] ?: ($categoryIcons[$meta['category']] ?? null),
                    'points' => array_sum(array_column($meta['tiers'], 'points')),
                    'wiki' => Wiki::named($meta['name']),
                    'occurred_at' => $e['occurred_at'],
                ];
            })->all(),
        ];
    }

    /** @param  array<string, mixed>  $row */
    private function isDone(array $row): bool
    {
        return (bool) ($row['done'] ?? false) || (int) ($row['repeated'] ?? 0) > 0;
    }

    /** @param  array<string, mixed>|null  $meta */
    private function resets(?array $meta): bool
    {
        return $meta !== null && array_intersect(self::RESETTING, $meta['flags']) !== [];
    }

    /**
     * The account's achievement rows, by id.
     *
     * @return array<int, array<string, mixed>>
     */
    private function accountRows(int $gw2AccountId): array
    {
        $rows = json_decode((string) DB::table('gw2_account_state')
            ->where('gw2_account_id', $gw2AccountId)
            ->value('achievements'), true);

        $out = [];

        foreach (is_array($rows) ? $rows : [] as $row) {
            if (isset($row['id'])) {
                $out[(int) $row['id']] = $row;
            }
        }

        return $out;
    }

    /**
     * Every achievement, boiled down to what the sums need.
     *
     * 8,339 rows whose tiers and flags are json — decoded once per catalogue
     * build and kept, because they only change when the game does.
     *
     * @return array<int, array{name: string, icon: ?string, category: int, tiers: array<int, array{count: int, points: int}>, flags: array<int, string>, cap: ?int}>
     */
    private function catalogue(): array
    {
        // The read time as well as the build: a forced re-read of the same
        // build (which is how point caps first arrive) has to be seen.
        $meta = DB::table('gw2_catalog_meta')->where('endpoint', 'achievements')->first(['build_id', 'refreshed_at']);
        $version = (int) ($meta->build_id ?? 0).':'.strtotime((string) ($meta->refreshed_at ?? ''));

        return Cache::remember("gw2:achievement-sums:{$version}", 86400, function () {
            $out = [];

            DB::table('gw2_achievements')
                ->orderBy('id')
                ->select(['id', 'name', 'icon', 'category_id', 'tiers', 'flags', 'point_cap'])
                ->chunk(2000, function ($rows) use (&$out) {
                    foreach ($rows as $row) {
                        $out[(int) $row->id] = [
                            'name' => (string) $row->name,
                            'icon' => $row->icon,
                            'category' => (int) $row->category_id,
                            'tiers' => array_map(fn ($t) => [
                                'count' => (int) ($t['count'] ?? 0),
                                'points' => (int) ($t['points'] ?? 0),
                            ], (array) (json_decode((string) $row->tiers, true) ?: [])),
                            'flags' => (array) (json_decode((string) $row->flags, true) ?: []),
                            'cap' => $row->point_cap !== null ? (int) $row->point_cap : null,
                        ];
                    }
                });

            return $out;
        });
    }

    /** @return array<int|string, array<string, mixed>> */
    private function reference(string $kind): array
    {
        $out = [];

        foreach (DB::table('gw2_reference')->where('kind', $kind)->pluck('payload') as $payload) {
            $row = json_decode((string) $payload, true);

            if (isset($row['id'])) {
                $out[$row['id']] = $row;
            }
        }

        return $out;
    }
}
