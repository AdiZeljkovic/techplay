<?php

namespace App\Console\Commands;

use App\Models\AnalyticsBreakdown;
use App\Models\AnalyticsDaily;
use App\Models\AnalyticsEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Turns a day of hits into a day of numbers.
 *
 * Rebuilds rather than accumulates: running it twice for the same day gives
 * the same answer, and running it again after a fix corrects the history
 * instead of doubling it. That matters more than it sounds — the raw rows are
 * pruned after ninety days, so a rollup that drifted could never be checked
 * against anything afterwards.
 *
 * Runs for yesterday at 03:00 and for today every ten minutes, so the admin
 * page is current without reading millions of raw rows to draw a chart.
 */
class RollUpAnalytics extends Command
{
    protected $signature = 'analytics:rollup {--day= : A date, default yesterday and today}';

    protected $description = 'Roll raw analytics hits into the daily tables';

    /**
     * GA writes consent as `G1` then ad storage then analytics storage, so
     * `G111` is both granted and `G100` is neither. The fourth character is
     * the one this site's reader count used to depend on entirely.
     */
    private const ANALYTICS_GRANTED = 4;

    public function handle(): int
    {
        $days = $this->option('day')
            ? [Carbon::parse($this->option('day'))]
            : [now()->subDay(), now()];

        foreach ($days as $day) {
            $this->rollUp($day->startOfDay());
        }

        return self::SUCCESS;
    }

    private function rollUp(Carbon $day): void
    {
        $from = $day->copy()->startOfDay();
        $to = $day->copy()->endOfDay();

        $readers = fn () => AnalyticsEvent::readers()->whereBetween('occurred_at', [$from, $to]);

        $totals = (clone $readers())
            ->selectRaw('count(distinct visitor) as visitors')
            ->selectRaw('count(distinct session) as sessions')
            // CASE rather than FILTER: the suite runs on SQLite and this
            // has to mean the same thing on both.
            ->selectRaw("sum(case when event = 'page_view' then 1 else 0 end) as pageviews")
            ->selectRaw('coalesce(sum(engagement_ms), 0) as engagement_ms')
            ->first();

        /*
         * An engaged session is GA's definition, near enough: more than one
         * page, or ten seconds somewhere in it. Computed as its own query
         * because it is a count of groups, and a count of groups cannot be
         * had from the same select as a count of rows.
         */
        $engaged = (clone $readers())
            ->whereNotNull('session')
            ->groupBy('session')
            ->havingRaw("sum(case when event = 'page_view' then 1 else 0 end) > 1 or coalesce(sum(engagement_ms), 0) >= 10000")
            ->select('session')
            ->get()
            ->count();

        $bots = AnalyticsEvent::where('is_bot', true)->whereBetween('occurred_at', [$from, $to])->count();

        $consented = (clone $readers())
            ->whereRaw('substr(consent, ?, 1) = ?', [self::ANALYTICS_GRANTED, '1'])
            ->distinct()
            ->count('visitor');

        /*
         * Found by date rather than by equality.
         *
         * The `date` cast writes `2026-09-08 00:00:00`, so looking the row up
         * with `where day = '2026-09-08'` never matches the row it just wrote
         * — and the second run of the day inserts a duplicate instead of
         * updating. Which is exactly the accumulation this command exists to
         * avoid, and it fails loudly on the unique index rather than quietly,
         * so at least it could not have shipped.
         */
        $row = AnalyticsDaily::whereDate('day', $from->toDateString())->first()
            ?? new AnalyticsDaily(['day' => $from->toDateString()]);

        $row->fill([
            'visitors' => (int) ($totals->visitors ?? 0),
            'sessions' => (int) ($totals->sessions ?? 0),
            'pageviews' => (int) ($totals->pageviews ?? 0),
            'engaged_sessions' => $engaged,
            'engagement_ms' => (int) ($totals->engagement_ms ?? 0),
            'bot_hits' => $bots,
            'consented_visitors' => $consented,
        ])->save();

        // Rebuilt wholesale: a page that lost all its traffic today must
        // disappear from today rather than keep yesterday's number.
        AnalyticsBreakdown::whereDate('day', $from->toDateString())->delete();

        $this->breakdown($readers, $from, 'page', 'path', 'title');
        $this->breakdown($readers, $from, 'referrer', 'referrer_host');
        $this->breakdown($readers, $from, 'country', 'country');
        $this->breakdown($readers, $from, 'device', 'device');
        $this->breakdown($readers, $from, 'browser', 'browser');

        $this->info(sprintf(
            '%s — %d visitors, %d views, %d bot hits set aside',
            $from->toDateString(),
            $totals->visitors ?? 0,
            $totals->pageviews ?? 0,
            $bots
        ));
    }

    /**
     * One dimension's rows for one day.
     *
     * Capped at 500 values. A site with 333,198 game pages will produce a very
     * long tail of paths seen once, and keeping all of them forever would make
     * the history table larger than the raw one it was meant to replace.
     */
    private function breakdown(\Closure $readers, Carbon $day, string $kind, string $column, ?string $label = null): void
    {
        $rows = $readers()
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->select($column)
            ->selectRaw('count(distinct visitor) as visitors')
            // CASE rather than FILTER: the suite runs on SQLite and this
            // has to mean the same thing on both.
            ->selectRaw("sum(case when event = 'page_view' then 1 else 0 end) as pageviews")
            ->selectRaw('coalesce(sum(engagement_ms), 0) as engagement_ms')
            ->when($label, fn ($q) => $q->selectRaw("min({$label}) as label"))
            ->orderByDesc('visitors')
            ->limit(500)
            ->get();

        if ($rows->isEmpty()) {
            return;
        }

        AnalyticsBreakdown::insert($rows->map(fn ($row) => [
            'day' => $day->toDateString(),
            'kind' => $kind,
            'value' => $row->{$column},
            'label' => $label ? ($row->label ?? null) : null,
            'visitors' => (int) $row->visitors,
            'pageviews' => (int) $row->pageviews,
            'engagement_ms' => (int) $row->engagement_ms,
        ])->all());
    }
}
