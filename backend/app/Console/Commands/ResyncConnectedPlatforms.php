<?php

namespace App\Console\Commands;

use App\Jobs\SyncEpicLibrary;
use App\Jobs\SyncGogLibrary;
use App\Jobs\SyncPlayStationLibrary;
use App\Jobs\SyncSteamLibrary;
use App\Jobs\SyncXboxLibrary;
use App\Models\ConnectedAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Keeps connected libraries from freezing the day they were linked.
 *
 * Presence was polled every two minutes and achievements pulled nightly, but
 * the library itself — the games, the hours, the statuses everything else is
 * derived from — only ever moved when somebody pressed Re-sync by hand. A
 * shelf linked in August still read as August in December: no new purchases,
 * no new hours, and "Continue playing" pointing at whatever was open that week.
 *
 * Weekly rather than nightly because a library is not a fast-moving thing, and
 * because each Steam sync now costs one API call per played game — 92 of them
 * on a real library, where it used to be ten.
 */
class ResyncConnectedPlatforms extends Command
{
    protected $signature = 'platforms:resync
        {--user= : Only this user id}
        {--provider= : Only steam, xbox, playstation, gog or epic}
        {--force : Ignore the freshness window and re-sync everything}';

    protected $description = 'Queue a library re-sync for connected platform accounts';

    /**
     * Six days, not seven.
     *
     * The window is what stops this undoing a reader's own Re-sync: press the
     * button on Tuesday and the Wednesday run leaves you alone. It is a day
     * short of the schedule so a run that starts a few minutes late — or a week
     * that drifts by an hour over a DST change — does not skip everybody.
     */
    private const FRESH_FOR_HOURS = 144;

    /**
     * Steam is asked once per played game, so ten libraries starting together
     * is a burst worth flattening. Thirty seconds apart puts a hundred accounts
     * across fifty minutes, which nothing here is in a hurry to beat.
     */
    private const STAGGER_SECONDS = 30;

    public function handle(): int
    {
        $accounts = ConnectedAccount::query()
            ->when($this->option('user'), fn ($q) => $q->where('user_id', $this->option('user')))
            ->when($this->option('provider'), fn ($q) => $q->where('provider', $this->option('provider')))
            // `expired` is PlayStation's own: the token aged out and only the
            // reader can renew it, so retrying weekly is noise. `syncing` is
            // already in flight.
            ->whereNotIn('sync_status', ['syncing', 'expired'])
            ->when(! $this->option('force'), fn ($q) => $q->where(
                fn ($w) => $w->whereNull('last_synced_at')
                    ->orWhere('last_synced_at', '<', now()->subHours(self::FRESH_FOR_HOURS))
            ))
            ->get(['id', 'provider', 'user_id']);

        if ($accounts->isEmpty()) {
            $this->info('Nema naloga za osvježavanje.');

            return self::SUCCESS;
        }

        $queued = 0;
        $skipped = 0;

        foreach ($accounts->values() as $i => $account) {
            $delay = now()->addSeconds($i * self::STAGGER_SECONDS);

            $job = match ($account->provider) {
                'steam' => SyncSteamLibrary::dispatch($account->id),
                'xbox' => SyncXboxLibrary::dispatch($account->id),
                'gog' => SyncGogLibrary::dispatch($account->id),
                'epic' => SyncEpicLibrary::dispatch($account->id),
                'playstation' => SyncPlayStationLibrary::dispatch($account->id),
                default => null,
            };

            if (! $job) {
                $skipped++;

                continue;
            }

            $job->onQueue('default')->delay($delay);
            $queued++;
        }

        // Said out loud because this is the only trace a weekly job leaves.
        Log::info("platforms:resync queued {$queued} account(s), skipped {$skipped}");
        $this->info("Zakazano osvježavanje za {$queued} nalog(a)".($skipped ? ", preskočeno {$skipped}" : '').'.');

        return self::SUCCESS;
    }
}
