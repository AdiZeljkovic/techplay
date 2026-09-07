<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
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
     * What the app on somebody's phone needs to know about itself.
     *
     * This is the one piece of API discipline that cannot be added after the
     * fact. The site and the API deploy together, so a change to one is a
     * change to both in the same minute. A released app breaks that: copies
     * of it are on phones that will never be updated, and a response edited on
     * a Tuesday breaks a version from March — silently, because that reader
     * simply stops appearing rather than filing a report.
     *
     * So the server states the oldest build it is still willing to serve, and
     * the app checks on launch. `minimum` is a refusal: below it the app shows
     * an update screen rather than making calls it cannot understand.
     * `recommended` is a nudge, dismissible, for a build that still works.
     *
     * Both are settings rather than constants, so raising the floor is an
     * admin edit rather than a deploy — which matters on the day a bad build
     * is discovered, when a deploy is the last thing anybody wants to do.
     *
     * Deliberately public and unauthenticated: an app too old to sign in still
     * has to be able to learn that it is too old.
     */
    public function appVersion()
    {
        return response()->json([
            'data' => [
                /*
                 * Build numbers, not marketing versions. A store build number
                 * only ever increases and never carries a dot, which makes
                 * "is this older than that" an integer comparison rather than
                 * an argument about whether 1.10 comes after 1.9.
                 */
                'minimum' => (int) SiteSetting::get('app_min_build', 1),
                'recommended' => (int) SiteSetting::get('app_recommended_build', 1),
                'store_url' => [
                    'ios' => SiteSetting::get('app_store_url_ios', ''),
                    'android' => SiteSetting::get('app_store_url_android', ''),
                ],
                /*
                 * Said by the server so the reason can be changed without a
                 * release — which is the entire point, since the app being
                 * told this is by definition one that cannot be changed.
                 */
                'message' => SiteSetting::get(
                    'app_update_message',
                    'This version of the app is too old to talk to TechPlay. Update it to carry on.'
                ),
            ],
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
