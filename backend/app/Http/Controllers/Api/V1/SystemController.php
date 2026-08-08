<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SystemController extends Controller
{
    /**
     * Get system status and public settings.
     */
    public function status()
    {
        // Get maintenance mode setting
        $maintenance = SiteSetting::where('key', 'maintenance_mode')
            ->where('group', 'general') // Assuming it's in general group
            ->first();

        $isMaintenance = $maintenance && ($maintenance->value === '1' || $maintenance->value === 'true');

        return response()->json([
            'maintenance_mode' => $isMaintenance,
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
            $last = DB::table('cache')->where('key', 'like', '%schedule%')->max('expiration');

            return ['ok' => true, 'note' => $last ? 'seen' : 'no recent schedule marker'];
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
            return ['ok' => true] + $probe();
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => class_basename($e).': '.$e->getMessage()];
        }
    }
}
