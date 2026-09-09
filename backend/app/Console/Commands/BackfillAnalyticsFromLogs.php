<?php

namespace App\Console\Commands;

use App\Models\AnalyticsEvent;
use App\Services\AnalyticsCollector;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Recovers the days the counter existed for but was not yet running.
 *
 * The relay has been writing every GA hit into nginx's access log since it went
 * in on 2 September 2026 — the whole query string, the address and the user
 * agent, which is everything the collector reads. The counter itself only
 * started on the 9th. So a week of real traffic is sitting in the logs, and
 * nothing about reading it is a guess.
 *
 * What it cannot recover, and why that matters:
 *
 * `sec-ch-ua` is not in the access log. That is the header the bot rule leans
 * on — a client claiming Chrome while sending none is not a browser — so a
 * backfilled day is filtered by declared user agents alone and will understate
 * its bots. In this window that is a small error: the scraper swarm blocked on
 * the 8th ran no JavaScript at all and never reached the relay, and what did
 * reach it was Bingbot and Applebot, both of which say who they are.
 *
 * Nothing before 2 September is recoverable. Hits went straight to Google then
 * and left no trace on this machine.
 */
class BackfillAnalyticsFromLogs extends Command
{
    protected $signature = 'analytics:backfill
        {--from= : First day, default the oldest log}
        {--to= : Last day, default yesterday}
        {--logs=/var/log/nginx : Where the access logs are}
        {--replace : Re-import days that already have rows}';

    protected $description = 'Rebuild analytics for past days from the relay hits in nginx logs';

    /**
     * The combined log format, which is what this server writes:
     * `ip - user [time] "request" status bytes "referer" "agent"`
     */
    private const LINE = '/^(?<ip>\S+) \S+ \S+ \[(?<time>[^\]]+)\] "(?<method>\S+) (?<uri>\S+)[^"]*" \S+ \S+ "[^"]*" "(?<agent>[^"]*)"/';

    public function handle(AnalyticsCollector $collector): int
    {
        $to = $this->option('to') ? Carbon::parse($this->option('to')) : now()->subDay();
        $from = $this->option('from') ? Carbon::parse($this->option('from')) : $to->copy()->subDays(14);

        $files = $this->logs();

        if ($files === []) {
            $this->error('No access logs found in '.$this->option('logs'));

            return self::FAILURE;
        }

        $this->info(sprintf('Reading %d log files for %s → %s', count($files), $from->toDateString(), $to->toDateString()));

        /*
         * Days already holding rows are skipped rather than merged.
         *
         * The live ingestion knows `sec-ch-ua` and this does not, so importing
         * over a day that was measured properly would replace good filtering
         * with worse. `--replace` is there for the case where that is what you
         * actually want.
         */
        $existing = AnalyticsEvent::selectRaw('date(occurred_at) as d')
            ->distinct()
            ->pluck('d')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->all();

        $imported = [];
        $skipped = 0;

        foreach ($files as $file) {
            foreach ($this->lines($file) as $line) {
                if (! str_contains($line, '/proxy/ga')) {
                    continue;
                }

                if (! preg_match(self::LINE, $line, $m)) {
                    continue;
                }

                $when = $this->time($m['time']);

                if (! $when || $when->lt($from->copy()->startOfDay()) || $when->gt($to->copy()->endOfDay())) {
                    continue;
                }

                $day = $when->toDateString();

                if (in_array($day, $existing, true) && ! $this->option('replace')) {
                    $skipped++;

                    continue;
                }

                if ($this->option('replace') && ! isset($imported[$day])) {
                    AnalyticsEvent::whereDate('occurred_at', $day)->delete();
                }

                $params = $this->params($m['uri']);

                if ($params === []) {
                    continue;
                }

                $event = $collector->record(
                    $params,
                    $m['ip'],
                    $m['agent'],
                    // Unknown, not false: claiming the header was absent would
                    // mark every real Chrome in the window as a scraper.
                    hasClientHints: true,
                    occurredAt: $when,
                );

                if ($event) {
                    $imported[$day] = ($imported[$day] ?? 0) + 1;
                }
            }
        }

        if ($imported === []) {
            $this->warn($skipped > 0
                ? "Nothing imported — {$skipped} hits belong to days that already have rows. Use --replace to redo them."
                : 'Nothing imported — no relay hits in that range.');

            return self::SUCCESS;
        }

        ksort($imported);

        foreach ($imported as $day => $count) {
            $this->line(sprintf('  %s  %6d hits', $day, $count));
        }

        $this->newLine();
        $this->info('Imported '.array_sum($imported).' hits across '.count($imported).' days.');
        $this->comment('Now run: php artisan analytics:rollup --day=<each day>');

        return self::SUCCESS;
    }

    /** Oldest first, so a day split across a rotation arrives in order. */
    private function logs(): array
    {
        $dir = rtrim($this->option('logs'), '/');

        $files = array_merge(
            glob("{$dir}/access.log.*.gz") ?: [],
            glob("{$dir}/access.log.[0-9]") ?: [],
            file_exists("{$dir}/access.log") ? ["{$dir}/access.log"] : [],
        );

        // access.log.14.gz is older than access.log.2.gz, so the number sorts
        // backwards — highest first, then the uncompressed ones, then today's.
        usort($files, function ($a, $b) {
            preg_match('/\.(\d+)(\.gz)?$/', $a, $x);
            preg_match('/\.(\d+)(\.gz)?$/', $b, $y);

            return (int) ($y[1] ?? 0) <=> (int) ($x[1] ?? 0);
        });

        return $files;
    }

    /** Streamed, not read: a week of logs is a few hundred megabytes. */
    private function lines(string $file): \Generator
    {
        $handle = str_ends_with($file, '.gz') ? gzopen($file, 'rb') : fopen($file, 'rb');

        if (! $handle) {
            return;
        }

        $read = str_ends_with($file, '.gz')
            ? fn () => gzgets($handle)
            : fn () => fgets($handle);

        while (($line = $read()) !== false) {
            yield $line;
        }

        str_ends_with($file, '.gz') ? gzclose($handle) : fclose($handle);
    }

    /**
     * `08/Sep/2026:14:22:31 +0000`, moved into the timezone everything else
     * here lives in.
     *
     * nginx writes UTC and the application runs on Europe/Sarajevo. Without
     * the conversion the range is filtered in one zone and the row is stamped
     * in another, which is not a rounding error: the first trial run asked for
     * 7 September and wrote 85 rows dated the 6th, because 22:00-24:00 UTC on
     * the 6th is already the 7th here.
     */
    private function time(string $stamp): ?Carbon
    {
        try {
            return Carbon::createFromFormat('d/M/Y:H:i:s O', $stamp)
                ->setTimezone(config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }
    }

    /** @return array<string, string> */
    private function params(string $uri): array
    {
        $query = parse_url($uri, PHP_URL_QUERY);

        if (! is_string($query) || $query === '') {
            return [];
        }

        parse_str($query, $params);

        return array_map(fn ($v) => is_scalar($v) ? (string) $v : '', $params);
    }
}
