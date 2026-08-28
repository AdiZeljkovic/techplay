<?php

namespace Tests\Feature;

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
