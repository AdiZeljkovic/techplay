<?php

namespace App\Jobs\Concerns;

use App\Models\ConnectedAccount;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Leave no library stuck in `syncing`.
 *
 * Each of the five library jobs stamps `sync_status = 'syncing'` on the way in
 * and settles it to `done` or `error` in its own try/catch. A timeout never
 * reaches that catch: the worker kills the job where it stands, so the row
 * keeps saying `syncing` forever. `platforms:resync` then skips it for good —
 * it excludes exactly that status — and the member's library silently stops
 * being refreshed, with nothing anywhere reporting a fault.
 *
 * Timeouts are not hypothetical here: SyncSteamLibrary makes one achievements
 * call per played game inside a 120-second budget, so a large enough library
 * cannot finish.
 *
 * Laravel calls failed() after the final attempt, including a timeout kill.
 */
trait ReleasesTheSyncLock
{
    public function failed(?Throwable $e): void
    {
        $account = ConnectedAccount::find($this->connectedAccountId);

        if (! $account) {
            return;
        }

        // Only when it is still holding the lock: a job that already recorded
        // `expired` or `private` said something more useful than "error".
        if ($account->sync_status === 'syncing') {
            $account->update([
                'sync_status' => 'error',
                'sync_error' => 'The sync did not finish. Try again.',
            ]);
        }

        Log::error(class_basename(static::class).' failed', [
            'connected_account_id' => $this->connectedAccountId,
            'error' => $e?->getMessage(),
        ]);
    }
}
