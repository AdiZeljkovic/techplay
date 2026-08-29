<?php

namespace App\Jobs;

use App\Models\BrokenLink;
use App\Services\LinkChecker;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Re-check a handful of links away from the request.
 *
 * The admin's "Check again" did this inline. Each link is allowed ten seconds
 * of network, the action capped the selection at twenty-five, and `/admin` is
 * served through nginx's `location /` with `proxy_read_timeout 60s` — so a
 * selection of seven was already past the timeout. The admin got a 504, the
 * records the loop had reached were updated anyway, and the notification that
 * would have said how many now work never arrived. The work half-happened and
 * looked like a failure.
 *
 * On the queue the same loop is fine: nothing is waiting on it, and the panel
 * reads the result from the table on the next refresh.
 */
class RecheckBrokenLinks implements ShouldQueue
{
    use Queueable;

    /**
     * Ten seconds a link, and this runs them in series, so the timeout has to
     * cover the whole batch with room for the checker's own retries.
     */
    public int $timeout = 600;

    public int $tries = 1;

    /** @param  array<int,int>  $ids */
    public function __construct(private array $ids) {}

    public function handle(LinkChecker $checker): void
    {
        $links = BrokenLink::whereIn('id', $this->ids)->get();
        $fixed = 0;

        foreach ($links as $link) {
            try {
                $result = $checker->check($link->url);
            } catch (\Throwable $e) {
                // One unreachable host must not cost the rest of the batch.
                Log::warning('Link re-check failed', ['url' => $link->url, 'error' => $e->getMessage()]);

                continue;
            }

            $link->update([
                'status_code' => $result['status_code'],
                'error_message' => $result['error_message'],
                'last_checked_at' => now(),
                'is_fixed' => $result['ok'],
            ]);

            $fixed += $result['ok'] ? 1 : 0;
        }

        Log::info("Re-checked {$links->count()} links, {$fixed} now work.");
    }
}
