<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Registrations nobody ever confirmed hold an email address and a username out
 * of circulation forever — including addresses belonging to people who never
 * signed up, who are then told the address is already registered.
 *
 * The command is deliberately timid, and these tests are mostly about what it
 * refuses to touch.
 */
class PruneUnverifiedUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_deletes_a_stale_unconfirmed_registration(): void
    {
        $abandoned = User::factory()->create([
            'email_verified_at' => null,
            'created_at' => now()->subDays(45),
            'xp' => 0,
        ]);

        $this->artisan('users:prune-unverified')->assertSuccessful();

        $this->assertDatabaseMissing('users', ['id' => $abandoned->id]);
    }

    public function test_it_leaves_a_recent_registration_alone(): void
    {
        // Someone who signed up yesterday and has not opened the email yet.
        $fresh = User::factory()->create([
            'email_verified_at' => null,
            'created_at' => now()->subDays(2),
        ]);

        $this->artisan('users:prune-unverified')->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $fresh->id]);
    }

    public function test_it_never_touches_a_verified_account(): void
    {
        $real = User::factory()->create([
            'email_verified_at' => now()->subYear(),
            'created_at' => now()->subYears(2),
        ]);

        $this->artisan('users:prune-unverified')->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $real->id]);
    }

    public function test_an_unverified_account_that_has_done_something_is_kept(): void
    {
        // "Unverified" may predate verification being enforced. Deleting a real
        // person's history would be worse than the problem being solved.
        $old = User::factory()->create([
            'email_verified_at' => null,
            'created_at' => now()->subDays(400),
            'xp' => 250,
        ]);

        $this->artisan('users:prune-unverified')->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $old->id]);
    }

    public function test_a_dry_run_deletes_nothing(): void
    {
        $abandoned = User::factory()->create([
            'email_verified_at' => null,
            'created_at' => now()->subDays(45),
            'xp' => 0,
        ]);

        $this->artisan('users:prune-unverified --dry-run')->assertSuccessful();

        $this->assertDatabaseHas('users', ['id' => $abandoned->id]);
    }
}
