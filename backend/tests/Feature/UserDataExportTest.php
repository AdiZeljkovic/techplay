<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\User;
use App\Services\UserDataExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The export has to keep up with the schema.
 *
 * An export is a list of tables somebody wrote down once, and a list written
 * once goes stale silently — which is the same failure as account deletion,
 * where four names on the list were columns that do not exist and the one that
 * did, `gamertags`, was never on it.
 *
 * So this does not check that the export includes the right things. It reads
 * the database for every table carrying a user id and fails when one of them
 * has not been classified either way. Adding a feature that stores something
 * about a person then cannot ship without somebody deciding whether the person
 * gets it back.
 */
class UserDataExportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Tables that link to a user but are not the user's own data.
     *
     * @var list<string>
     */
    private const NOT_PERSONAL = [
        // Laravel's own furniture
        'sessions', 'password_reset_tokens', 'personal_access_tokens',
        'notifications', 'jobs', 'failed_jobs', 'job_batches', 'cache', 'cache_locks',
        // Rows about somebody else that happen to name this user
        'giveaway_tier_winners',
    ];

    private function userLinkedTables(): array
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $rows = DB::select(
                "select distinct table_name from information_schema.columns
                 where column_name in ('user_id', 'author_id', 'sender_id')
                   and table_schema = 'public'"
            );

            return array_map(fn ($r) => $r->table_name, $rows);
        }

        // SQLite, which is what the suite runs on.
        $tables = [];
        foreach (DB::select("select name from sqlite_master where type='table'") as $t) {
            $name = $t->name;
            if (str_starts_with($name, 'sqlite_')) {
                continue;
            }
            foreach (DB::select("pragma table_info('{$name}')") as $col) {
                if (in_array($col->name, ['user_id', 'author_id', 'sender_id'], true)) {
                    $tables[] = $name;
                    break;
                }
            }
        }

        return $tables;
    }

    public function test_every_table_that_names_a_person_has_been_decided_about(): void
    {
        $classified = UserDataExportService::classifiedTables();

        $unclassified = array_values(array_diff(
            $this->userLinkedTables(),
            $classified,
            self::NOT_PERSONAL,
        ));

        sort($unclassified);

        $this->assertSame(
            [],
            $unclassified,
            "These tables hold something about a person and the export has no opinion on them.\n"
            ."Add each to UserDataExportService::EXPORTED (they get it back) or ::EXCLUDED (with the reason why not):\n  "
            .implode("\n  ", $unclassified)
        );
    }

    /**
     * A credential is not the person's data to be handed back.
     *
     * The export reads with the query builder, not Eloquent, so a model's
     * `$hidden` does nothing to it — `connected_accounts` and
     * `user_integrations` were both shipping `access_token` and
     * `refresh_token` in the downloaded file. Encrypted, so not immediately
     * usable, but ciphertext of somebody's Steam, Discord and Guild Wars 2
     * credentials stays decryptable for as long as APP_KEY does.
     *
     * The check is on the whole serialised document rather than on named keys,
     * because the next table with a token on it will not be one of these two.
     */
    public function test_no_credential_reaches_the_exported_file(): void
    {
        $user = User::factory()->create();
        $key = 'C6BBD845-DD9F-C84D-80E3-A976646FDDE3-BBAE5D91-1248-4243-BAA3-E51992';

        $connection = ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'gw2',
            'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452',
            'access_token' => $key,
        ]);

        $document = json_encode(app(UserDataExportService::class)->export($user));

        // Neither the key itself nor the ciphertext it is stored as.
        $this->assertStringNotContainsString($key, $document);
        $this->assertStringNotContainsString($connection->getAttributes()['access_token'], $document);
        $this->assertStringNotContainsString('access_token', $document);

        // And the row is still there — the person gets everything but the
        // credential, which is the point.
        $this->assertStringContainsString('Garamel.6452', $document);
    }

    /**
     * The Guild Wars 2 history is the one part that cannot be got again.
     *
     * The game's API reports raid clears for the current week and world bosses
     * for the current day, and has no lifetime view of either. These rows are
     * the difference between two of our reads, so if somebody takes their data
     * and leaves, this is the only copy in existence.
     */
    public function test_the_export_carries_guild_wars_2_progress_history(): void
    {
        $user = User::factory()->create();

        $connection = ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'gw2',
            'provider_user_id' => 'ABC-123',
            'display_name' => 'Garamel.6452',
            'access_token' => 'k',
        ]);

        $accountId = DB::table('gw2_accounts')->insertGetId([
            'connected_account_id' => $connection->id,
            'user_id' => $user->id,
            'arena_account_id' => 'ABC-123',
            'name' => 'Garamel.6452',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('gw2_progress_events')->insert([
            'gw2_account_id' => $accountId,
            'type' => 'raid_encounter_cleared',
            'payload' => json_encode(['id' => 'spirit_woods']),
            'occurred_at' => now(),
        ]);

        $payload = app(UserDataExportService::class)->export($user);

        // Reached through gw2_accounts, not through a user id — which is why
        // the column scan above cannot see it and it is listed by hand.
        $this->assertArrayHasKey('gw2_progress_history', $payload['data']);
        $this->assertSame('raid_encounter_cleared', $payload['data']['gw2_progress_history'][0]->type);
    }

    public function test_the_export_carries_the_account_and_refuses_the_password(): void
    {
        $user = User::factory()->create(['bio' => 'Nešto o meni']);

        $payload = app(UserDataExportService::class)->export($user);

        $this->assertSame('Nešto o meni', $payload['profile']['bio']);
        $this->assertArrayNotHasKey('password', $payload['profile'], 'The password hash left the building.');
        $this->assertArrayNotHasKey('remember_token', $payload['profile']);
        $this->assertNotEmpty($payload['not_included'], 'What is left out should be stated, not silently dropped.');
    }

    public function test_the_endpoint_needs_a_signed_in_user_and_answers_with_a_file(): void
    {
        $this->getJson('/api/v1/user/export-data')->assertUnauthorized();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/api/v1/user/export-data');

        $response->assertOk();
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition') ?? '');
        $this->assertStringContainsString($user->username, $response->headers->get('content-disposition') ?? '');
    }
}
