<?php

namespace App\Console\Commands;

use App\Services\FunnelAnalytics;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Activation-funnel report: per-day signups, wizard engagement, platform
 * connects and the core activation metric (% of new accounts with >= 1
 * game in their collection within 24h of signing up).
 *
 * Wizard/connect counters come from Redis (FunnelAnalytics), activation
 * comes straight from the database so it works retroactively.
 */
class FunnelReport extends Command
{
    protected $signature = 'analytics:funnel {--days=14 : How many days back to report}';

    protected $description = 'Show the profile activation funnel (signups, wizard, connects, activation, D1)';

    public function handle(): int
    {
        $days = max(1, min(90, (int) $this->option('days')));
        $from = now()->subDays($days - 1)->startOfDay();

        // Signups per day
        $signups = DB::table('users')
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') AS d, COUNT(*) AS c")
            ->where('created_at', '>=', $from)
            ->groupBy('d')->pluck('c', 'd');

        // Activated: signed up that day AND added >= 1 game within 24h
        $activated = DB::table('users')
            ->selectRaw("to_char(users.created_at, 'YYYY-MM-DD') AS d, COUNT(DISTINCT users.id) AS c")
            ->join('user_games', 'user_games.user_id', '=', 'users.id')
            ->where('users.created_at', '>=', $from)
            ->whereRaw("user_games.created_at <= users.created_at + interval '24 hours'")
            ->groupBy('d')->pluck('c', 'd');

        // New platform connects per day (steam + xbox), from DB for accuracy
        $connects = DB::table('connected_accounts')
            ->selectRaw("to_char(created_at, 'YYYY-MM-DD') AS d, provider, COUNT(*) AS c")
            ->where('created_at', '>=', $from)
            ->groupBy('d', 'provider')->get()
            ->groupBy('d');

        $rows = [];
        $totals = ['signups' => 0, 'activated' => 0, 'shown' => 0, 'completed' => 0, 'skipped' => 0, 'steam' => 0, 'xbox' => 0, 'd1' => 0];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $events = FunnelAnalytics::counts($date);

            $shown = $events['wizard_shown'] ?? 0;
            $completed = ($events['wizard_pick_done'] ?? 0)
                + ($events['wizard_steam_click'] ?? 0)
                + ($events['wizard_xbox_submitted'] ?? 0);
            $skipped = $events['wizard_skipped'] ?? 0;

            $dayConnects = $connects->get($date, collect());
            $steam = (int) ($dayConnects->firstWhere('provider', 'steam')->c ?? 0);
            $xbox = (int) ($dayConnects->firstWhere('provider', 'xbox')->c ?? 0);

            $s = (int) ($signups[$date] ?? 0);
            $a = (int) ($activated[$date] ?? 0);
            $d1 = $events['d1_return'] ?? 0;

            $totals['signups'] += $s;
            $totals['activated'] += $a;
            $totals['shown'] += $shown;
            $totals['completed'] += $completed;
            $totals['skipped'] += $skipped;
            $totals['steam'] += $steam;
            $totals['xbox'] += $xbox;
            $totals['d1'] += $d1;

            $rows[] = [
                $date,
                $s,
                $a.($s > 0 ? ' ('.round($a / $s * 100).'%)' : ''),
                $shown,
                $completed,
                $skipped,
                $steam,
                $xbox,
                $d1,
            ];
        }

        $this->table(
            ['Date', 'Signups', 'Activated <24h', 'Wizard shown', 'Wizard path', 'Skipped', 'Steam', 'Xbox', 'D1 return'],
            $rows
        );

        $rate = $totals['signups'] > 0 ? round($totals['activated'] / $totals['signups'] * 100) : 0;
        $wizardRate = $totals['shown'] > 0 ? round($totals['completed'] / $totals['shown'] * 100) : 0;
        $d1Rate = $totals['signups'] > 0 ? round($totals['d1'] / $totals['signups'] * 100) : 0;

        $this->newLine();
        $this->info("Last {$days} days: {$totals['signups']} signups | activation {$rate}% | wizard path-taken {$wizardRate}% | Steam {$totals['steam']} / Xbox {$totals['xbox']} connects | D1 return ~{$d1Rate}%");

        return self::SUCCESS;
    }
}
