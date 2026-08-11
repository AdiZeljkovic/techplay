<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * Is the enrichment actually enriching?
 *
 * Every pipeline that fills the games database catches its own errors, logs a
 * warning and carries on — which is right, because one bad game should not
 * stop the run. The cost is that a systematic failure looks exactly like a
 * quiet night: the command reports success, the site renders fine, and nothing
 * is ever filled again. An expired API key can hide here for months.
 *
 * This command answers the only question that matters: how much did each
 * source add recently, and is the Steam drip still moving.
 */
class EnrichmentStatus extends Command
{
    protected $signature = 'games:enrichment-status {--days=7 : How far back to count}';

    protected $description = 'Report what each enrichment pipeline has actually filled';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $since = now()->subDays($days);
        $pg = DB::getDriverName() === 'pgsql';

        $total = DB::table('games')->count();
        $this->info('Games in catalogue: '.number_format($total));
        $this->newLine();

        // ── coverage: how much of the catalogue each source has reached ──
        $has = fn (string $sql) => (int) DB::table('games')->whereRaw($sql)->count();

        $covers = $has($pg ? "cover_url is not null and cover_url <> ''" : 'cover_url is not null');
        $videos = $has($pg ? 'videos is not null and jsonb_array_length(videos::jsonb) > 0' : 'videos is not null');
        $metacritic = $has($pg ? "critic_scores::jsonb -> 'metacritic' is not null" : "json_extract(critic_scores, '$.metacritic') is not null");
        $opencritic = $has($pg ? "critic_scores::jsonb -> 'opencritic' is not null" : "json_extract(critic_scores, '$.opencritic') is not null");
        $descriptions = $has('description is not null');

        $pct = fn (int $n) => $total > 0 ? round($n / $total * 100, 1).'%' : '—';

        $this->table(['Field', 'Filled', 'Coverage'], [
            ['cover_url', number_format($covers), $pct($covers)],
            ['videos (trailers)', number_format($videos), $pct($videos)],
            ['description', number_format($descriptions), $pct($descriptions)],
            ['critic_scores.metacritic', number_format($metacritic), $pct($metacritic)],
            ['critic_scores.opencritic', number_format($opencritic), $pct($opencritic)],
        ]);

        // ── movement: coverage means nothing if it stopped growing ──
        $recent = (int) DB::table('games')->where('updated_at', '>=', $since)->count();
        $this->line("Games touched in the last {$days} days: ".number_format($recent));

        if ($recent === 0) {
            $this->error('  Nothing has been written to the catalogue in that window.');
            $this->line('  Check: is the queue worker running, and did the Steam drip stop?');
        }

        // ── the Steam drip: a self-dispatching chain that can quietly end ──
        $this->newLine();
        $this->info('Steam appdetails drip');

        $counts = DB::table('game_external_ids')
            ->where('provider', 'steam')
            ->selectRaw(($pg
                ? "metadata::jsonb ->> 'status'"
                : "json_extract(metadata, '$.status')").' as status, count(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status');

        foreach (['candidate', 'enriched', 'rejected'] as $status) {
            $this->line(sprintf('  %-10s %s', $status, number_format((int) ($counts[$status] ?? 0))));
        }

        $pending = (int) ($counts['candidate'] ?? 0);

        if ($pending > 0) {
            // The chain only continues while a job is in flight or queued.
            $queued = 0;
            try {
                $queued = (int) Redis::llen('queues:default');
            } catch (\Throwable) {
                $this->warn('  Could not read the queue — Redis unreachable?');
            }

            $this->line('  queued jobs: '.number_format($queued));

            if ($queued === 0) {
                $this->warn('  '.number_format($pending).' games still waiting and nothing queued.');
                $this->line('  The drip is a chain that dispatches its own successor, so a worker');
                $this->line('  restart mid-job ends it silently. Restart it with:');
                $this->line('    php artisan games:enrich-steam');
            }
        } else {
            $this->line('  Nothing left to enrich from Steam.');
        }

        // ── the daily budgets, so a spent key is visible ──
        $this->newLine();
        $this->info('Daily budgets');
        $this->line('  OpenCritic: '.(config('services.opencritic.key') ? 'key present' : 'NO KEY — enrichment cannot run'));
        $this->line('  YouTube:    '.(config('services.youtube.key') ? 'key present' : 'NO KEY — trailers cannot run'));

        return self::SUCCESS;
    }
}
