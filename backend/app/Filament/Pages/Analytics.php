<?php

namespace App\Filament\Pages;

use App\Models\AnalyticsBreakdown;
use App\Models\AnalyticsDaily;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * What the site's traffic actually is.
 *
 * Google Analytics reported 11 active users on 8 September 2026. It was not
 * broken: on 2 September the consent banner was finally wired to Consent Mode,
 * and GA counts active users only from readers who grant analytics storage —
 * that day 2,094 hits said no and 157 said yes. Before then the tag declared
 * consent nobody had given and stored no client id, so every page load counted
 * as a new person; that is where 70,000 "users" in ninety days came from, and
 * why the average engagement time read five seconds.
 *
 * This page reads neither of those. It reads our own count, taken from the
 * same relay the GA hits already pass through, storing no cookie and no
 * address — so it counts everybody, including the 93% who decline.
 *
 * Two honesties are built into the page rather than left to the reader.
 *
 * Bots are counted and shown, not filtered away in silence: every figure here
 * excludes them and the page says how many it excluded. And a range longer
 * than a day sums daily visitors rather than claiming unique people, because
 * the visitor hash is rebuilt nightly on purpose — that is exactly what makes
 * it lawful without consent, and it is why "unique visitors this month" is a
 * question this design cannot answer. Saying so beats inventing it.
 */
class Analytics extends Page
{
    /** Business metrics — traffic, revenue, conversion. */
    public static function canAccess(): bool
    {
        $user = auth()->user();

        return $user && $user->isAdmin();
    }

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-chart-bar';

    protected string $view = 'filament.pages.analytics';

    protected static string|\UnitEnum|null $navigationGroup = 'System';

    protected static ?int $navigationSort = 50;

    protected static ?string $title = 'Analitika';

    /** 7, 30 or 90 days. Held on the page so the whole view moves together. */
    public int $range = 30;

    public function setRange(int $days): void
    {
        $this->range = in_array($days, [7, 30, 90], true) ? $days : 30;
    }

    public function getViewData(): array
    {
        $from = today()->subDays($this->range - 1);
        $days = $this->series($from, today());

        // The same length of time immediately before, for the comparison.
        $previousFrom = $from->copy()->subDays($this->range);
        $previous = $this->series($previousFrom, $from->copy()->subDay());

        $sum = fn (Collection $rows, string $key) => (int) $rows->sum($key);

        $engagementMs = $sum($days, 'engagement_ms');
        $sessions = $sum($days, 'sessions');

        /*
         * When counting actually began.
         *
         * The range buttons say 30 days; on the day this shipped they drew two
         * hours and looked like a catastrophe. A period that starts before the
         * first row is not a period with no traffic, it is a period we were not
         * there for, and the page has to say which.
         */
        $since = AnalyticsDaily::min('day');
        $since = $since ? Carbon::parse($since) : null;

        return [
            'range' => $this->range,
            'from' => $from,
            'since' => $since && $since->gt($from) ? $since : null,
            'days' => $days,
            'totals' => [
                'visitors' => $sum($days, 'visitors'),
                'pageviews' => $sum($days, 'pageviews'),
                'sessions' => $sessions,
                'engaged' => $sum($days, 'engaged_sessions'),
                'bots' => $sum($days, 'bot_hits'),
                'consented' => $sum($days, 'consented_visitors'),
                // Seconds a session was actually engaged, which is the number
                // GA reported as five when nothing could recognise a reader.
                'engagement' => $sessions > 0 ? (int) round($engagementMs / 1000 / $sessions) : 0,
            ],
            'change' => [
                'visitors' => $this->change($sum($days, 'visitors'), $sum($previous, 'visitors')),
                'pageviews' => $this->change($sum($days, 'pageviews'), $sum($previous, 'pageviews')),
            ],
            'pages' => $this->breakdown('page', $from),
            'referrers' => $this->breakdown('referrer', $from),
            'countries' => $this->breakdown('country', $from),
            'devices' => $this->breakdown('device', $from),
            'browsers' => $this->breakdown('browser', $from),
        ];
    }

    /**
     * One row per day, including the days nothing happened.
     *
     * A chart drawn only from the rows that exist puts Monday next to Thursday
     * at the same spacing and reads as a smooth week.
     */
    private function series(Carbon $from, Carbon $to): Collection
    {
        $rows = AnalyticsDaily::whereBetween('day', [$from->toDateString(), $to->toDateString()])
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($row) => $row->day->toDateString());

        $out = collect();

        for ($day = $from->copy(); $day->lte($to); $day->addDay()) {
            $key = $day->toDateString();

            $out->push($rows->get($key) ?? new AnalyticsDaily([
                'day' => $key,
                'visitors' => 0, 'sessions' => 0, 'pageviews' => 0,
                'engaged_sessions' => 0, 'engagement_ms' => 0,
                'bot_hits' => 0, 'consented_visitors' => 0,
            ]));
        }

        return $out;
    }

    private function breakdown(string $kind, Carbon $from): Collection
    {
        return AnalyticsBreakdown::where('kind', $kind)
            ->where('day', '>=', $from->toDateString())
            ->groupBy('value')
            ->select('value')
            ->selectRaw('sum(visitors) as visitors')
            ->selectRaw('sum(pageviews) as pageviews')
            ->selectRaw('min(label) as label')
            ->orderByDesc('visitors')
            ->limit(12)
            ->get();
    }

    /** Null rather than a percentage when there is nothing to compare against. */
    private function change(int $now, int $before): ?float
    {
        return $before > 0 ? round((($now - $before) / $before) * 100, 1) : null;
    }
}
