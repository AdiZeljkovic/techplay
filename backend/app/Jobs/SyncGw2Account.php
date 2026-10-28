<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Services\Gw2\AccountSync;
use App\Services\Gw2\Gw2KeyRejected;
use App\Services\Gw2\Gw2RateLimited;
use App\Services\Gw2\Gw2Unavailable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Read one player's account from ArenaNet.
 *
 * A job rather than a controller because the rate limit belongs to the whole
 * site: it is counted per IP and every request TechPlay makes leaves from one
 * server, so the twenty-odd requests a full read spends while somebody waits
 * on a page are twenty another reader does not get. The queue is what keeps
 * that fair.
 *
 * The backoff is long on purpose. Measured on 27 September 2026, the bucket
 * refills completely inside thirty seconds — but a rate limit means the whole
 * site is busy, not that this account is special, and retrying in five seconds
 * would put this job back at the front of a queue it just exhausted.
 */
class SyncGw2Account implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 4;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900];

    public int $timeout = 300;

    public function __construct(
        public int $connectionId,
        public bool $quick = false,
    ) {}

    public function handle(AccountSync $sync): void
    {
        $connection = ConnectedAccount::find($this->connectionId);

        // Disconnected between queueing and running. Nothing to do, and
        // nothing to complain about.
        if (! $connection) {
            return;
        }

        $connection->forceFill(['sync_status' => 'syncing'])->save();

        try {
            $result = $this->quick ? $sync->quick($connection) : $sync->full($connection);

            Log::channel('connections')->info('GW2 account synced', [
                'connection' => $connection->id,
                'mode' => $this->quick ? 'quick' : 'full',
                'calls' => $result['calls'],
                'events' => $result['events'],
            ]);
        } catch (Gw2RateLimited $e) {
            /*
             * The last attempt says so instead of releasing again. A release
             * past `tries` is not retried — the worker fails the job without
             * running it — so the row used to sit at "pending" for good, and
             * the page kept saying a read was on its way.
             */
            if ($this->attempts() >= $this->tries) {
                $connection->forceFill([
                    'sync_status' => 'error',
                    'sync_error' => 'ArenaNet was too busy to read your account just now. What you see is from the last read, and the nightly read will try again.',
                ])->save();

                return;
            }

            /*
             * Not this account's fault and not a failure. Put it back and let
             * the backoff carry it past the busy minute; the connection keeps
             * its previous state so the dashboard still has something to draw.
             */
            $connection->forceFill(['sync_status' => 'pending'])->save();

            $this->release($this->backoff[$this->attempts() - 1] ?? 900);
        } catch (Gw2KeyRejected $e) {
            /*
             * This API is documented to answer "invalid key" transiently, so
             * one refusal proves nothing. Only the last attempt writes the
             * connection off — and even then the snapshot stays, because the
             * player's history is not the key's to take with it.
             */
            if ($this->attempts() < $this->tries) {
                throw $e;
            }

            /*
             * A limited token past its date is refused exactly like a deleted
             * key, and the fix is different: reconnect, rather than go and look
             * for a key that is still there.
             */
            $expires = $connection->metadata['token_expires_at'] ?? null;
            $expired = ($connection->metadata['token_kind'] ?? null) === 'subtoken'
                && $expires && now()->greaterThanOrEqualTo($expires);

            $connection->forceFill([
                'sync_status' => 'error',
                'sync_error' => $expired
                    ? 'The limited token we hold for your account expired. Connect your key again and we will issue a new one.'
                    : 'ArenaNet refused the key. It may have been deleted at account.arena.net.',
            ])->save();
        } catch (Gw2Unavailable $e) {
            if ($this->attempts() < $this->tries) {
                throw $e;
            }

            $connection->forceFill([
                'sync_status' => 'error',
                'sync_error' => 'ArenaNet could not be reached. Your last synced data is still shown.',
            ])->save();
        }
    }

    /**
     * Everything handle() did not see coming.
     *
     * A database error, a worker killed at the timeout, an exception nobody
     * named — each ends here once the retries are spent, and before this method
     * existed each one left the connection at "syncing" or "pending" forever:
     * a spinner on the page and a sync button that looked busy.
     */
    public function failed(?Throwable $e): void
    {
        $connection = ConnectedAccount::find($this->connectionId);

        if (! $connection) {
            return;
        }

        $connection->forceFill([
            'sync_status' => 'error',
            'sync_error' => 'Reading your account failed on our side. Your last synced data is still shown, and the nightly read will try again.',
        ])->save();

        Log::channel('connections')->warning('GW2 account sync failed', [
            'connection' => $connection->id,
            'mode' => $this->quick ? 'quick' : 'full',
            'error' => $e?->getMessage(),
        ]);
    }
}
