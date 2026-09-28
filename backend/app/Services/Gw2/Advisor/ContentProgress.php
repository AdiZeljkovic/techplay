<?php

namespace App\Services\Gw2\Advisor;

use Illuminate\Support\Facades\DB;

/**
 * Raids, dungeons and world bosses — this period, and ever since we started
 * watching.
 *
 * Three endpoints, one shape of problem. `/v2/account/raids` reports what has
 * been cleared since the weekly reset; `/v2/account/worldbosses` and
 * `/v2/account/dungeons` since the daily one. **None of them has a lifetime
 * view anywhere in the API.** Ask the game what somebody has ever killed and
 * there is no answer.
 *
 * So there are two columns here and they mean genuinely different things. "This
 * week" comes from the game and is complete. "Ever" comes from
 * `gw2_progress_events` — the difference between two of our reads — and begins
 * on the day the account connected, never before. The interface has to say so,
 * because a first-timer's empty "ever" column would otherwise read as a claim
 * about their nine years of play.
 *
 * All three account endpoints answer in bare slugs: `["samarog","deimos"]`.
 * The wings those belong to come from `/v2/raids`, which is why the catalogue
 * mirrors it.
 */
class ContentProgress
{
    /**
     * @return array<string, mixed>
     */
    public function for(Snapshot $snapshot): array
    {
        $everCleared = $this->everCleared($snapshot->accountId);

        return [
            'raids' => $this->raids($snapshot, $everCleared),
            'world_bosses' => $this->worldBosses($snapshot, $everCleared),
            'dungeons' => $this->dungeons($snapshot),
            /*
             * The date the "ever" column starts from. Not decoration: without
             * it, an account connected yesterday appears to have done nothing
             * in nine years of play.
             */
            'tracked_since' => DB::table('gw2_accounts')->where('id', $snapshot->accountId)->value('created_at'),
        ];
    }

    /**
     * @param  array<string, bool>  $ever
     * @return array<string, mixed>
     */
    private function raids(Snapshot $snapshot, array $ever): array
    {
        $thisWeek = array_flip($snapshot->raidsThisWeek);
        $wings = [];

        foreach ($this->reference('raids') as $raid) {
            foreach ($raid['wings'] ?? [] as $wing) {
                $encounters = [];

                foreach ($wing['events'] ?? [] as $event) {
                    $id = $event['id'] ?? null;

                    if ($id === null) {
                        continue;
                    }

                    $encounters[] = [
                        'id' => $id,
                        'name' => $this->humanise($id),
                        // Boss or Checkpoint. A checkpoint is not a kill and
                        // counting it as one would inflate every wing.
                        'type' => $event['type'] ?? 'Boss',
                        'cleared_this_week' => isset($thisWeek[$id]),
                        'ever_cleared' => isset($ever[$id]),
                    ];
                }

                $bosses = array_filter($encounters, fn ($e) => $e['type'] === 'Boss');

                $wings[] = [
                    'raid' => $this->humanise($raid['id'] ?? ''),
                    'wing' => $this->humanise($wing['id'] ?? ''),
                    'encounters' => $encounters,
                    'bosses' => count($bosses),
                    'cleared_this_week' => count(array_filter($bosses, fn ($e) => $e['cleared_this_week'])),
                    'ever_cleared' => count(array_filter($bosses, fn ($e) => $e['ever_cleared'])),
                ];
            }
        }

        return [
            'wings' => $wings,
            'cleared_this_week' => count($snapshot->raidsThisWeek),
            'bosses_total' => array_sum(array_column($wings, 'bosses')),
        ];
    }

    /**
     * @param  array<string, bool>  $ever
     * @return array<string, mixed>
     */
    private function worldBosses(Snapshot $snapshot, array $ever): array
    {
        $today = array_flip($snapshot->bossesToday);
        $bosses = [];

        foreach ($this->reference('worldbosses') as $boss) {
            $id = $boss['id'] ?? null;

            if ($id === null) {
                continue;
            }

            $bosses[] = [
                'id' => $id,
                'name' => $this->humanise($id),
                'killed_today' => isset($today[$id]),
                'ever_killed' => isset($ever[$id]),
            ];
        }

        return [
            'bosses' => $bosses,
            'killed_today' => count($snapshot->bossesToday),
            'total' => count($bosses),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dungeons(Snapshot $snapshot): array
    {
        $today = array_flip($snapshot->dungeonPathsToday);
        $dungeons = [];

        foreach ($this->reference('dungeons') as $dungeon) {
            $paths = [];

            foreach ($dungeon['paths'] ?? [] as $path) {
                $id = $path['id'] ?? null;

                if ($id === null) {
                    continue;
                }

                $paths[] = [
                    'id' => $id,
                    'name' => $this->humanise($id),
                    // Story or Explorable. Story runs once; the explorable paths
                    // are the ones with a daily reward.
                    'type' => $path['type'] ?? 'Explorable',
                    'run_today' => isset($today[$id]),
                ];
            }

            $dungeons[] = [
                'id' => $dungeon['id'] ?? '',
                'name' => $this->humanise($dungeon['id'] ?? ''),
                'paths' => $paths,
                'run_today' => count(array_filter($paths, fn ($p) => $p['run_today'])),
            ];
        }

        return [
            'dungeons' => $dungeons,
            'paths_today' => count($snapshot->dungeonPathsToday),
        ];
    }

    /**
     * Everything this account has been seen to clear, ever.
     *
     * "Ever" means since the day it connected, which is the honest limit. These
     * rows are written by comparing two reads, so nothing before the first read
     * exists — and nothing can be recovered, because the game keeps no history
     * of its own.
     *
     * @return array<string, bool>
     */
    private function everCleared(int $accountId): array
    {
        return DB::table('gw2_progress_events')
            ->where('gw2_account_id', $accountId)
            ->whereIn('type', ['raid_encounter_cleared', 'world_boss_killed'])
            ->pluck('payload')
            ->mapWithKeys(fn ($payload) => [(string) (json_decode($payload, true)['id'] ?? '') => true])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reference(string $kind): array
    {
        return DB::table('gw2_reference')
            ->where('kind', $kind)
            ->orderBy('ref_id')
            ->pluck('payload')
            ->map(fn ($p) => json_decode($p, true) ?: [])
            ->all();
    }

    /**
     * `vale_guardian` into `Vale Guardian`.
     *
     * The API carries no display name for any of these — raids, wings,
     * encounters, world bosses and dungeon paths are all bare slugs — so this is
     * mechanical rather than a guess. Where the game's own capitalisation
     * differs from title case (an "of" or a "the" mid-name) the result is
     * slightly off, and that is a cost worth paying over inventing a name table.
     */
    private function humanise(string $slug): string
    {
        $words = explode(' ', str_replace('_', ' ', $slug));

        return implode(' ', array_map(
            fn ($word, $i) => $i > 0 && in_array($word, ['of', 'the', 'and'], true)
                ? $word
                : ucfirst($word),
            $words,
            array_keys($words)
        ));
    }
}
