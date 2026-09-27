<?php

namespace App\Services\Gw2;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Connecting, checking and disconnecting a Guild Wars 2 key.
 *
 * ArenaNet retired OAuth; what a player has is a key they generate themselves
 * at account.arena.net, read-only and scoped to whichever permissions they
 * ticked. So the whole trust model here is: never ask for a password, take the
 * key over the wire once, store it encrypted, and say plainly what it can and
 * cannot see.
 *
 * `connected_accounts` already does the storing — the column is encrypted
 * through a mutator, hidden from serialisation, and carries the scopes and
 * sync state. This class adds the part that is specific to this API: asking
 * /v2/tokeninfo what the key is actually allowed to read, before promising
 * the player anything.
 */
class Gw2Connection
{
    public const PROVIDER = 'gw2';

    /**
     * Without these the advisor cannot do its job at all.
     *
     * `account` is identity; `progression` carries achievements, masteries,
     * the fractal level, the Wizard's Vault and the weekly raid state. A key
     * missing either answers almost nothing.
     */
    public const REQUIRED = ['account', 'progression'];

    /**
     * Missing any of these costs a module, not the product.
     *
     * Each one is named here so the connect screen can say which feature goes
     * dark rather than rendering an empty page and letting the player guess.
     */
    public const WANTED = [
        'characters' => 'your characters, their gear and Agony Resistance',
        'builds' => 'which specializations and traits you are running',
        'inventories' => 'what you own across bags, bank and material storage',
        'unlocks' => 'mounts, recipes and the Legendary Armory',
        'wallet' => 'your currencies, for goal and material planning',
    ];

    public function __construct(private readonly Gw2Client $api) {}

    /**
     * Attach a key to a TechPlay account.
     *
     * The key is checked against the live API before anything is written. A
     * key that cannot be read is not stored, because a stored dead key is a
     * connection the player believes in and a sync that fails every night.
     */
    public function connect(User $user, string $key): ConnectedAccount
    {
        $key = trim($key);

        $info = $this->inspect($key);

        $missing = array_diff(self::REQUIRED, $info['permissions']);

        if ($missing !== []) {
            throw ValidationException::withMessages([
                'api_key' => [
                    'This key is missing the '.implode(' and ', $missing).' permission'
                    .(count($missing) > 1 ? 's' : '').'. Create a new key with those ticked — '
                    .'the advisor cannot read your progress without them.',
                ],
            ]);
        }

        $account = $this->api->account('account', $key);

        /*
         * One game account, one TechPlay account.
         *
         * The unique index on (provider, provider_user_id) enforces it, but a
         * duplicate-key error is not an explanation. Somebody pasting a key
         * that is already attached elsewhere is usually a person with two
         * TechPlay logins, and they deserve to be told that.
         */
        $taken = ConnectedAccount::query()
            ->where('provider', self::PROVIDER)
            ->where('provider_user_id', $account['id'])
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                'api_key' => ['That Guild Wars 2 account is already connected to another TechPlay profile.'],
            ]);
        }

        return DB::transaction(function () use ($user, $key, $info, $account) {
            /** @var ConnectedAccount $connection */
            $connection = ConnectedAccount::updateOrCreate(
                ['user_id' => $user->id, 'provider' => self::PROVIDER],
                [
                    'provider_user_id' => $account['id'],
                    'display_name' => $account['name'] ?? null,
                    'access_token' => $key,          // encrypted by the model
                    'scopes' => $info['permissions'],
                    'sync_status' => 'pending',
                    'sync_error' => null,
                    'metadata' => [
                        // The key's own name, as the player titled it at
                        // account.arena.net. Useful when they have several and
                        // need to know which one to revoke.
                        'key_name' => $info['name'] ?? null,
                        'key_id' => $info['id'] ?? null,
                        'connected_at' => now()->toIso8601String(),
                    ],
                ]
            );

            DB::table('gw2_accounts')->updateOrInsert(
                ['connected_account_id' => $connection->id],
                [
                    'user_id' => $user->id,
                    'arena_account_id' => $account['id'],
                    'name' => $account['name'] ?? null,
                    'world' => $account['world'] ?? null,
                    'fractal_level' => $account['fractal_level'] ?? null,
                    'daily_ap' => $account['daily_ap'] ?? null,
                    'monthly_ap' => $account['monthly_ap'] ?? null,
                    'wvw_rank' => $account['wvw_rank'] ?? null,
                    'game_account_created_at' => isset($account['created']) ? date('Y-m-d H:i:s', strtotime($account['created'])) : null,
                    'access' => json_encode($account['access'] ?? [], JSON_UNESCAPED_UNICODE),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            return $connection;
        });
    }

    /**
     * Ask the API what this key can read.
     *
     * Kept separate so the connect screen can check a pasted key before the
     * player commits to it, and so a nightly job can notice that permissions
     * were narrowed after the fact.
     *
     * @return array{id: ?string, name: ?string, permissions: array<int, string>}
     */
    public function inspect(string $key): array
    {
        if ($key === '' || ! preg_match('/^[A-F0-9-]{20,200}$/i', $key)) {
            throw ValidationException::withMessages([
                'api_key' => ['That does not look like a Guild Wars 2 API key. Copy the whole line from account.arena.net.'],
            ]);
        }

        try {
            $info = $this->api->tokenInfo($key);
        } catch (Gw2KeyRejected) {
            throw ValidationException::withMessages([
                'api_key' => ['ArenaNet refused that key. Check it was copied whole, and that it has not been deleted.'],
            ]);
        } catch (Gw2Unavailable) {
            throw ValidationException::withMessages([
                'api_key' => ['ArenaNet is not answering right now. Nothing was saved — try again in a minute.'],
            ]);
        }

        return [
            'id' => $info['id'] ?? null,
            'name' => $info['name'] ?? null,
            'permissions' => array_values($info['permissions'] ?? []),
        ];
    }

    /**
     * Which optional permissions are absent, and what that costs.
     *
     * @param  array<int, string>  $granted
     * @return array<string, string>
     */
    public function missingFeatures(array $granted): array
    {
        return array_diff_key(self::WANTED, array_flip($granted));
    }

    /**
     * Remove the key and everything derived from it.
     *
     * The foreign keys cascade from `gw2_accounts` down through characters,
     * state, the ledger and the event history, so deleting the connection
     * really does leave nothing behind. That is the promise the connect screen
     * makes, and it has to be true.
     */
    public function disconnect(User $user): void
    {
        ConnectedAccount::query()
            ->where('user_id', $user->id)
            ->where('provider', self::PROVIDER)
            ->get()
            ->each->delete();
    }
}
