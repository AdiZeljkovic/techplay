<?php

namespace Tests\Feature;

use App\Jobs\SyncPlayStationLibrary;
use App\Jobs\SyncSteamLibrary;
use App\Jobs\SyncXboxLibrary;
use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The weekly library refresh, and the two things it must not do.
 *
 * Presence was polled every two minutes and achievements nightly, but the
 * library — games, hours, the statuses everything else is derived from — only
 * moved when somebody pressed Re-sync, so a shelf linked in August still read
 * as August in December.
 */
class PlatformResyncTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $provider, ?string $syncedAt, string $status = 'done'): ConnectedAccount
    {
        return ConnectedAccount::create([
            'user_id' => User::factory()->create()->id,
            'provider' => $provider,
            'provider_user_id' => (string) random_int(1000, 9999),
            'display_name' => 'someone',
            'sync_status' => $status,
            'last_synced_at' => $syncedAt,
            'visibility' => 'public',
        ]);
    }

    public function test_a_stale_library_is_queued(): void
    {
        Queue::fake();

        $this->account('steam', now()->subDays(9)->toDateTimeString());

        $this->artisan('platforms:resync')->assertSuccessful();

        Queue::assertPushed(SyncSteamLibrary::class, 1);
    }

    /**
     * The freshness window exists for this: press Re-sync yourself on Tuesday
     * and Wednesday's run has nothing to do.
     */
    public function test_a_library_synced_yesterday_is_left_alone(): void
    {
        Queue::fake();

        $this->account('steam', now()->subDay()->toDateTimeString());

        $this->artisan('platforms:resync')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_force_ignores_the_window(): void
    {
        Queue::fake();

        $this->account('steam', now()->subMinutes(5)->toDateTimeString());

        $this->artisan('platforms:resync', ['--force' => true])->assertSuccessful();

        Queue::assertPushed(SyncSteamLibrary::class, 1);
    }

    /** An account that has never synced has nothing fresher to protect. */
    public function test_an_account_that_never_synced_is_queued(): void
    {
        Queue::fake();

        $this->account('xbox', null);

        $this->artisan('platforms:resync')->assertSuccessful();

        Queue::assertPushed(SyncXboxLibrary::class, 1);
    }

    /**
     * An expired PlayStation token is not a transient failure — only the reader
     * can renew it, so retrying weekly is noise in the queue and in their logs.
     */
    public function test_expired_and_in_flight_accounts_are_skipped(): void
    {
        Queue::fake();

        $this->account('playstation', now()->subDays(30)->toDateTimeString(), 'expired');
        $this->account('steam', now()->subDays(30)->toDateTimeString(), 'syncing');

        $this->artisan('platforms:resync')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_each_provider_gets_its_own_job(): void
    {
        Queue::fake();

        $stale = now()->subDays(9)->toDateTimeString();
        $this->account('steam', $stale);
        $this->account('xbox', $stale);
        $this->account('playstation', $stale, 'done');

        $this->artisan('platforms:resync')->assertSuccessful();

        Queue::assertPushed(SyncSteamLibrary::class, 1);
        Queue::assertPushed(SyncXboxLibrary::class, 1);
        Queue::assertPushed(SyncPlayStationLibrary::class, 1);
    }

    public function test_it_can_be_pointed_at_one_provider(): void
    {
        Queue::fake();

        $stale = now()->subDays(9)->toDateTimeString();
        $this->account('steam', $stale);
        $this->account('xbox', $stale);

        $this->artisan('platforms:resync', ['--provider' => 'steam'])->assertSuccessful();

        Queue::assertPushed(SyncSteamLibrary::class, 1);
        Queue::assertNotPushed(SyncXboxLibrary::class);
    }
}
