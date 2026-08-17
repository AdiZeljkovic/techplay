<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SystemController extends Controller
{
    /**
     * A liveness ping, and nothing more.
     *
     * This used to answer the question "is the site in maintenance mode", which
     * the Next.js middleware asked on every single page request. Maintenance
     * mode is gone — the middleware was deleted with it, `/coming-soon` no
     * longer exists, and the setting it read outlived both by several months,
     * still toggleable from the admin and connected to nothing.
     *
     * One consumer remains: the Discord bot calls this to check the API is
     * awake. It types the reply as `{status, version}` and has never received a
     * `status` field, so that is added here rather than left as a lie in the
     * bot's type. It only ever checks whether the call threw.
     */
    public function status()
    {
        return response()->json([
            'status' => 'ok',
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * A health check that can actually fail.
     *
     * The old one read a settings row and reported 200 for everything else, so
     * a deploy that left Redis down, the queue dead and Reverb dead still
     * printed "Deployment Complete". This one names each dependency and
     * answers 503 when one of them is unwell, which is what an uptime monitor
     * and the deploy gate both need.
     */
    public function health()
    {
        $checks = [];

        $checks['database'] = $this->check(function () {
            DB::select('select 1');

            return ['ok' => true];
        });

        $checks['redis'] = $this->check(function () {
            Redis::ping();

            return ['ok' => true];
        });

        // A queue nobody drains is the classic silent failure: the site looks
        // fine while XP, notifications and enrichment quietly stop.
        $checks['queue'] = $this->check(function () {
            $pending = (int) Redis::llen('queues:default');
            $failed = (int) DB::table('failed_jobs')->count();

            return [
                'ok' => $pending < 5000 && $failed < 100,
                'pending' => $pending,
                'failed' => $failed,
            ];
        });

        // The scheduler is a cron line that lives outside the repo. If it was
        // never installed, nothing else here would notice.
        $checks['scheduler'] = $this->check(function () {
            $beat = Cache::get('scheduler:heartbeat');

            if (! $beat) {
                return [
                    'ok' => false,
                    'error' => 'No heartbeat. Is `* * * * * php artisan schedule:run` in the crontab?',
                ];
            }

            // Two minutes of slack for a busy minute; beyond that the cron
            // stopped and every scheduled task stopped with it.
            $age = now()->diffInSeconds(Carbon::parse($beat), true);

            return ['ok' => $age < 180, 'last_run' => $beat, 'age_seconds' => (int) $age];
        });

        $healthy = collect($checks)->every(fn ($c) => $c['ok'] === true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    /** Runs one check and turns any failure into a reportable result. */
    private function check(callable $probe): array
    {
        try {
            // array_merge, not `+`: the union operator keeps the LEFT value for
            // duplicate keys, so a probe reporting ok => false had its verdict
            // silently discarded and every check passed. A health check that
            // cannot fail is the thing this endpoint exists to replace.
            return array_merge(['ok' => true], $probe());
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => class_basename($e).': '.$e->getMessage()];
        }
    }
}
