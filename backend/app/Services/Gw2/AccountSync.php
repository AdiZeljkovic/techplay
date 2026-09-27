<?php

namespace App\Services\Gw2;

use App\Models\ConnectedAccount;
use Illuminate\Support\Facades\DB;

/**
 * Read one account, and write down what changed.
 *
 * Eighteen requests, measured against the live API on 27 September 2026:
 * seventeen account endpoints and one `characters?ids=all`. That last one is
 * the surprise — it returns the worn equipment, the bags, specializations,
 * skills, recipes and crafting in a single response, so `equipment_tabs` and
 * `build_tabs` are not needed at all unless inactive templates are ever shown.
 *
 * Two of those endpoints are the reason this class writes history rather than
 * only state. `/v2/account/raids` reports what has been cleared **since the
 * weekly reset** and `/v2/account/worldbosses` since the daily one; neither
 * has any lifetime view anywhere in the API. From the day an account connects,
 * the difference between two of these reads is the only record that will ever
 * exist of what that player has done.
 */
class AccountSync
{
    /**
     * The seventeen, and the permission each one needs.
     *
     * A key without `inventories` cannot answer what a player owns, and
     * asking anyway spends budget to receive a 403. The scope is checked
     * before the call, not after.
     */
    private const ENDPOINTS = [
        'account' => 'account',
        'account/achievements' => 'progression',
        'account/masteries' => 'progression',
        'account/mastery/points' => 'progression',
        'account/wallet' => 'wallet',
        'account/materials' => 'inventories',
        'account/bank' => 'inventories',
        'account/inventory' => 'inventories',
        'account/recipes' => 'unlocks',
        'account/legendaryarmory' => 'unlocks',
        'account/mounts/types' => 'unlocks',
        'account/progression' => 'progression',
        'account/raids' => 'progression',
        'account/worldbosses' => 'progression',
        'account/dailycrafting' => 'progression',
        'account/wizardsvault/daily' => 'progression',
        'account/wizardsvault/weekly' => 'progression',
    ];

    /** What a quick sync reads: the things that change within a day. */
    private const QUICK = [
        'account',
        'account/raids',
        'account/worldbosses',
        'account/dailycrafting',
        'account/wizardsvault/daily',
        'account/wizardsvault/weekly',
    ];

    public function __construct(private readonly Gw2Client $api) {}

    /**
     * Everything. Run on connect, then nightly.
     *
     * @return array{calls: int, events: int}
     */
    public function full(ConnectedAccount $connection): array
    {
        return $this->run($connection, array_keys(self::ENDPOINTS), withCharacters: true);
    }

    /**
     * The daily-moving parts, for a dashboard that was just opened.
     *
     * @return array{calls: int, events: int}
     */
    public function quick(ConnectedAccount $connection): array
    {
        return $this->run($connection, self::QUICK, withCharacters: false);
    }

    /**
     * @param  array<int, string>  $endpoints
     * @return array{calls: int, events: int}
     */
    private function run(ConnectedAccount $connection, array $endpoints, bool $withCharacters): array
    {
        $key = $connection->access_token;

        if (! $key) {
            throw new Gw2KeyRejected('No key is stored for this connection.');
        }

        $scopes = $connection->scopes ?? [];
        $accountId = $this->accountRowId($connection);

        $read = [];
        $calls = 0;

        foreach ($endpoints as $endpoint) {
            $needs = self::ENDPOINTS[$endpoint] ?? 'account';

            // Asking for what the key cannot see spends budget to be refused.
            if (! in_array($needs, $scopes, true)) {
                continue;
            }

            $read[$endpoint] = $this->api->account($endpoint, $key);
            $calls++;
        }

        if ($withCharacters && in_array('characters', $scopes, true)) {
            $read['characters'] = $this->api->account('characters', $key, ['ids' => 'all']);
            $calls++;
        }

        $events = DB::transaction(function () use ($accountId, $read, $withCharacters) {
            // The difference has to be taken before the new state overwrites
            // the old one — that ordering is the whole feature.
            $events = $this->diff($accountId, $read);

            $this->storeAccount($accountId, $read);
            $this->storeState($accountId, $read);

            if ($withCharacters && isset($read['characters'])) {
                $this->storeCharacters($accountId, $read['characters']);
                $this->storeLedger($accountId, $read);
            }

            return $events;
        });

        $connection->forceFill([
            'sync_status' => 'done',
            'sync_error' => null,
            'last_synced_at' => now(),
        ])->save();

        DB::table('gw2_accounts')->where('id', $accountId)->update(
            $withCharacters
                ? ['last_full_sync_at' => now(), 'last_quick_sync_at' => now(), 'updated_at' => now()]
                : ['last_quick_sync_at' => now(), 'updated_at' => now()]
        );

        return ['calls' => $calls, 'events' => $events];
    }

    private function accountRowId(ConnectedAccount $connection): int
    {
        $id = DB::table('gw2_accounts')->where('connected_account_id', $connection->id)->value('id');

        if (! $id) {
            throw new \RuntimeException('This connection has no gw2_accounts row; it was not created through Gw2Connection.');
        }

        return (int) $id;
    }

    /** @param array<string, mixed> $read */
    private function storeAccount(int $accountId, array $read): void
    {
        $account = $read['account'] ?? null;

        if (! is_array($account) || $account === []) {
            return;
        }

        DB::table('gw2_accounts')->where('id', $accountId)->update([
            'name' => $account['name'] ?? null,
            'world' => $account['world'] ?? null,
            'fractal_level' => $account['fractal_level'] ?? null,
            'daily_ap' => $account['daily_ap'] ?? null,
            'monthly_ap' => $account['monthly_ap'] ?? null,
            'wvw_rank' => $account['wvw_rank'] ?? null,
            'access' => json_encode($account['access'] ?? [], JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    /** @param array<string, mixed> $read */
    private function storeState(int $accountId, array $read): void
    {
        $columns = [
            'account/achievements' => 'achievements',
            'account/masteries' => 'masteries',
            'account/mastery/points' => 'mastery_points',
            'account/wallet' => 'wallet',
            'account/progression' => 'progression',
            'account/raids' => 'raids',
            'account/worldbosses' => 'world_bosses',
            'account/dailycrafting' => 'daily_crafting',
        ];

        $row = ['observed_at' => now()];

        foreach ($columns as $endpoint => $column) {
            // A quick sync reads six endpoints; the other columns must keep
            // whatever the last full sync left, not be blanked.
            if (array_key_exists($endpoint, $read)) {
                $row[$column] = json_encode($read[$endpoint], JSON_UNESCAPED_UNICODE);
            }
        }

        $unlocks = array_filter([
            'recipes' => $read['account/recipes'] ?? null,
            'mounts' => $read['account/mounts/types'] ?? null,
            'legendary_armory' => $read['account/legendaryarmory'] ?? null,
        ], fn ($v) => $v !== null);

        if ($unlocks !== []) {
            $row['unlocks'] = json_encode($unlocks, JSON_UNESCAPED_UNICODE);
        }

        $vault = array_filter([
            'daily' => $read['account/wizardsvault/daily'] ?? null,
            'weekly' => $read['account/wizardsvault/weekly'] ?? null,
        ], fn ($v) => $v !== null);

        if ($vault !== []) {
            $row['wizards_vault'] = json_encode($vault, JSON_UNESCAPED_UNICODE);
        }

        DB::table('gw2_account_state')->updateOrInsert(['gw2_account_id' => $accountId], $row);
    }

    /** @param array<int, array<string, mixed>> $characters */
    private function storeCharacters(int $accountId, array $characters): void
    {
        $seen = [];

        foreach ($characters as $character) {
            if (! isset($character['name'])) {
                continue;
            }

            $seen[] = $character['name'];

            DB::table('gw2_characters')->updateOrInsert(
                ['gw2_account_id' => $accountId, 'name' => $character['name']],
                [
                    'profession' => $character['profession'] ?? null,
                    'race' => $character['race'] ?? null,
                    'level' => (int) ($character['level'] ?? 0),
                    'age' => $character['age'] ?? null,
                    'deaths' => $character['deaths'] ?? null,
                    'character_created_at' => isset($character['created'])
                        ? date('Y-m-d H:i:s', strtotime($character['created']))
                        : null,
                    'equipment' => json_encode($character['equipment'] ?? [], JSON_UNESCAPED_UNICODE),
                    'specializations' => json_encode($character['specializations'] ?? [], JSON_UNESCAPED_UNICODE),
                    'skills' => json_encode($character['skills'] ?? [], JSON_UNESCAPED_UNICODE),
                    'crafting' => json_encode($character['crafting'] ?? [], JSON_UNESCAPED_UNICODE),
                    'observed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // A character the player deleted should stop being advised about.
        if ($seen !== []) {
            DB::table('gw2_characters')
                ->where('gw2_account_id', $accountId)
                ->whereNotIn('name', $seen)
                ->delete();
        }
    }

    /**
     * One ledger from four separate endpoints and every character's bags.
     *
     * Rebuilt rather than merged: an item moved from the bank to a bag would
     * otherwise be counted in both places, and a planner that double-counts
     * tells somebody they have enough ectoplasm when they do not.
     *
     * @param  array<string, mixed>  $read
     */
    private function storeLedger(int $accountId, array $read): void
    {
        $rows = [];
        $now = now();

        $push = function (?array $stack, string $location, ?string $ref) use (&$rows, $now) {
            foreach ($stack ?? [] as $slot) {
                // Bank and bag arrays are positional: an empty slot is a null,
                // and there are a great many of them.
                if (! is_array($slot) || ! isset($slot['id'])) {
                    continue;
                }

                $rows[] = [
                    'item_id' => (int) $slot['id'],
                    'quantity' => (int) ($slot['count'] ?? 1),
                    'location_type' => $location,
                    'location_ref' => $ref,
                    'stats_id' => isset($slot['stats']['id']) ? (int) $slot['stats']['id'] : null,
                    'upgrades' => isset($slot['upgrades']) ? json_encode($slot['upgrades']) : null,
                    'observed_at' => $now,
                ];
            }
        };

        $push($read['account/materials'] ?? null, 'materials', null);
        $push($read['account/bank'] ?? null, 'bank', null);
        $push($read['account/inventory'] ?? null, 'shared', null);

        foreach ($read['characters'] ?? [] as $character) {
            $name = $character['name'] ?? null;

            foreach ($character['bags'] ?? [] as $bag) {
                if (is_array($bag)) {
                    $push($bag['inventory'] ?? null, 'character', $name);
                }
            }

            $push($character['equipment'] ?? null, 'equipped', $name);
        }

        DB::table('gw2_item_ledger')->where('gw2_account_id', $accountId)->delete();

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('gw2_item_ledger')->insert(array_map(
                fn ($r) => $r + ['gw2_account_id' => $accountId],
                $chunk
            ));
        }
    }

    /**
     * What moved since last time.
     *
     * Deliberately narrow. Every field could be diffed, and the result would
     * be a feed nobody reads — "your karma went up" is not progress. These
     * four are the ones a player would have told somebody about.
     *
     * @param  array<string, mixed>  $read
     */
    private function diff(int $accountId, array $read): int
    {
        $before = DB::table('gw2_account_state')->where('gw2_account_id', $accountId)->first();

        // Nothing to compare against on the first read, and calling every
        // unlock an "event" would bury the account in a fake history.
        if (! $before) {
            return 0;
        }

        $events = [];

        $events = array_merge($events, $this->newIds(
            'mount_unlocked',
            json_decode($before->unlocks ?? '{}', true)['mounts'] ?? [],
            $read['account/mounts/types'] ?? null
        ));

        $events = array_merge($events, $this->newIds(
            'raid_encounter_cleared',
            json_decode($before->raids ?? '[]', true),
            $read['account/raids'] ?? null
        ));

        $events = array_merge($events, $this->newIds(
            'world_boss_killed',
            json_decode($before->world_bosses ?? '[]', true),
            $read['account/worldbosses'] ?? null
        ));

        $events = array_merge($events, $this->newAchievements(
            json_decode($before->achievements ?? '[]', true),
            $read['account/achievements'] ?? null
        ));

        if ($events === []) {
            return 0;
        }

        DB::table('gw2_progress_events')->insert(array_map(fn ($e) => [
            'gw2_account_id' => $accountId,
            'type' => $e['type'],
            'payload' => json_encode($e['payload'], JSON_UNESCAPED_UNICODE),
            'occurred_at' => now(),
        ], $events));

        return count($events);
    }

    /**
     * @param  array<int, mixed>  $before
     * @return array<int, array{type: string, payload: array<string, mixed>}>
     */
    private function newIds(string $type, array $before, ?array $after): array
    {
        // A quick sync may not have read this endpoint. Absent is not empty,
        // and treating it as empty would erase a week of raid clears.
        if ($after === null) {
            return [];
        }

        return array_map(
            fn ($id) => ['type' => $type, 'payload' => ['id' => $id]],
            array_values(array_diff($after, $before))
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $before
     * @return array<int, array{type: string, payload: array<string, mixed>}>
     */
    private function newAchievements(array $before, ?array $after): array
    {
        if ($after === null) {
            return [];
        }

        $was = [];

        foreach ($before as $row) {
            if (isset($row['id'])) {
                $was[$row['id']] = (bool) ($row['done'] ?? false);
            }
        }

        $events = [];

        foreach ($after as $row) {
            $id = $row['id'] ?? null;

            // Only the crossing into done. Progress from 3/10 to 4/10 is real
            // but it is not an event, and there are eight thousand of them.
            if ($id !== null && ($row['done'] ?? false) && ! ($was[$id] ?? false)) {
                $events[] = ['type' => 'achievement_completed', 'payload' => ['id' => $id]];
            }
        }

        return $events;
    }
}
