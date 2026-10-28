<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * Mastery insights on the map: where each one is, the nearest waypoint, and —
 * with an account — which are still to collect.
 *
 * Everything here comes from `/v2/continents` (mirrored per map by the
 * catalogue) and `account/mastery/points`. Whether the two share ids was not
 * documented anywhere, so it was checked before this was built: on 29 October
 * 2026 every one of the owner's 104 unlocked ids was either an insight id on
 * some floor (22) or an achievement's mastery reward (82). An insight is
 * collected exactly when its id is unlocked.
 *
 * The nearest waypoint is arithmetic on the game's own coordinates, and the
 * code beside it is the waypoint's own chat link from the same response —
 * pasted in game, it is the one-click way there. Nothing is placed by hand.
 *
 * Hero challenges are listed as what exists and nothing more: the per-character
 * endpoint that would say which are done (`characters/:id/heropoints`) has
 * returned an empty list for every character since End of Dragons' "What Lies
 * Beneath" episode, so any "left to do" would be invented.
 */
class MasteryInsights
{
    /** Insight region => the expansion name a reader knows it by. */
    private const REGION_LABELS = [
        'Tyria' => 'Central Tyria',
        'Maguuma' => 'Heart of Thorns',
        'Desert' => 'Path of Fire',
        'Tundra' => 'Icebrood Saga',
        'Jade' => 'End of Dragons',
        'Sky' => 'Secrets of the Obscure',
        'Wild' => 'Janthir Wilds',
        // The account endpoint names no region for this one (see
        // MasteryRegions); the maps it covers are Castora's, which is how the
        // label is known.
        'Magic' => 'Visions of Eternity',
    ];

    /**
     * Every map with insights, grouped by region, with counts.
     *
     * @param  array<int, int>|null  $unlocked  From `account/mastery/points`; null for nobody.
     * @return array<int, array<string, mixed>>
     */
    public function regions(?array $unlocked = null): array
    {
        $done = $unlocked === null ? null : array_fill_keys($unlocked, true);
        $regions = [];

        foreach ($this->maps() as $map) {
            foreach ($map['mastery_points'] as $point) {
                $key = (string) ($point['region'] ?? 'Unknown');

                $regions[$key] ??= [
                    'region' => $key,
                    'label' => self::REGION_LABELS[$key] ?? $key,
                    'total' => 0,
                    'collected' => $done === null ? null : 0,
                    'maps' => [],
                ];

                $regions[$key]['total']++;

                if ($done !== null && isset($done[(int) $point['id']])) {
                    $regions[$key]['collected']++;
                }

                $regions[$key]['maps'][$map['id']] ??= [
                    'id' => $map['id'],
                    'name' => $map['name'],
                    'slug' => self::slug($map['name']),
                    'total' => 0,
                    'collected' => $done === null ? null : 0,
                ];

                $regions[$key]['maps'][$map['id']]['total']++;

                if ($done !== null && isset($done[(int) $point['id']])) {
                    $regions[$key]['maps'][$map['id']]['collected']++;
                }
            }
        }

        $order = array_flip(array_keys(self::REGION_LABELS));
        uksort($regions, fn ($a, $b) => ($order[$a] ?? 99) <=> ($order[$b] ?? 99));

        return array_values(array_map(function ($region) {
            usort($region['maps'], fn ($a, $b) => $a['name'] <=> $b['name']);

            return $region;
        }, $regions));
    }

    /**
     * One map: its insights with their nearest waypoint, and its hero
     * challenges as a count.
     *
     * @param  array<int, int>|null  $unlocked
     * @return array<string, mixed>|null
     */
    public function map(int $mapId, ?array $unlocked = null): ?array
    {
        $map = $this->maps()[$mapId] ?? null;

        if (! $map) {
            return null;
        }

        $done = $unlocked === null ? null : array_fill_keys($unlocked, true);

        $insights = array_map(function (array $point) use ($map, $done) {
            $waypoint = $this->nearest($point['coord'] ?? null, $map['waypoints']);

            return [
                'id' => (int) $point['id'],
                'region' => $point['region'] ?? null,
                'coord' => $point['coord'] ?? null,
                'collected' => $done === null ? null : isset($done[(int) $point['id']]),
                'nearest_waypoint' => $waypoint,
            ];
        }, $map['mastery_points']);

        usort($insights, fn ($a, $b) => [$a['collected'] ?? false, $a['id']] <=> [$b['collected'] ?? false, $b['id']]);

        return [
            'id' => $map['id'],
            'name' => $map['name'],
            'slug' => self::slug($map['name']),
            'region' => $map['region'],
            'min_level' => $map['min_level'],
            'max_level' => $map['max_level'],
            'continent_rect' => $map['continent_rect'],
            'insights' => $insights,
            'insights_total' => count($insights),
            'insights_collected' => $done === null ? null : count(array_filter($insights, fn ($i) => $i['collected'])),
            'hero_challenges' => count($map['hero_challenges']),
            'waypoints' => array_values(array_map(fn ($w) => [
                'name' => $w['name'],
                'coord' => $w['coord'],
                'chat_link' => $w['chat_link'],
            ], $map['waypoints'])),
        ];
    }

    /**
     * The insight ids an account has unlocked, or null when the read had none.
     *
     * @return array<int, int>|null
     */
    public static function unlockedFor(int $gw2AccountId): ?array
    {
        $points = json_decode((string) DB::table('gw2_account_state')
            ->where('gw2_account_id', $gw2AccountId)
            ->value('mastery_points'), true);

        return is_array($points['unlocked'] ?? null) ? array_map('intval', $points['unlocked']) : null;
    }

    public static function slug(string $name): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($name)), '-');
    }

    /**
     * @param  array<int, float>|null  $coord
     * @param  array<int, array<string, mixed>>  $waypoints
     * @return array{name: ?string, chat_link: ?string, distance: int}|null
     */
    private function nearest(?array $coord, array $waypoints): ?array
    {
        if (! $coord || count($coord) < 2 || $waypoints === []) {
            return null;
        }

        $best = null;
        $bestDistance = INF;

        foreach ($waypoints as $waypoint) {
            if (! isset($waypoint['coord'][0], $waypoint['coord'][1])) {
                continue;
            }

            $distance = hypot($coord[0] - $waypoint['coord'][0], $coord[1] - $waypoint['coord'][1]);

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $best = $waypoint;
            }
        }

        return $best === null ? null : [
            'name' => $best['name'] ?? null,
            'chat_link' => $best['chat_link'] ?? null,
            // Continent units, which are what the game's map draws in. Only
            // used to say "close" or "a walk", never shown as a figure.
            'distance' => (int) round($bestDistance),
        ];
    }

    /** @return array<int, array<string, mixed>> map id => map */
    private function maps(): array
    {
        return DB::table('gw2_reference')
            ->where('kind', 'continent_maps')
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->filter(fn ($m) => isset($m['id']))
            ->keyBy('id')
            ->all();
    }
}
