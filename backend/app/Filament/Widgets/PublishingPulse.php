<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Is the site still publishing, and at what pace.
 *
 * For a gaming publication this is the vital sign. Google News wants a cadence,
 * readers want a reason to come back, and both notice a quiet fortnight long
 * before anybody inside does — the inside view is always "we published
 * something recently", because you remember writing it.
 *
 * So the middle number is deliberately "days since the last one", not a total.
 * A count of 622 published articles is true on the best week and the worst; the
 * gap since the last one is only ever true today.
 */
class PublishingPulse extends BaseWidget
{
    protected static ?int $sort = 2;

    protected ?string $heading = 'Publishing';

    protected function getStats(): array
    {
        $data = Cache::remember('dashboard.publishing.v1', 300, function () {
            $published = Article::where('status', 'published');

            return [
                'today' => (clone $published)->whereDate('published_at', today())->count(),
                'week' => (clone $published)->where('published_at', '>=', now()->startOfWeek())->count(),
                'month' => (clone $published)->where('published_at', '>=', now()->startOfMonth())->count(),
                'last' => (clone $published)->max('published_at'),
                'series' => $this->last14Days(),
            ];
        });

        $last = $data['last'] ? Carbon::parse($data['last']) : null;
        // copy() matters here. Carbon is mutable, so `$last->startOfDay()`
        // rewinds the instance to midnight — and the description below then
        // prints "00:00" for an article published at 15:58. It looked right
        // until the two were read side by side.
        $daysSince = $last ? (int) $last->copy()->startOfDay()->diffInDays(now()->startOfDay()) : null;

        return [
            Stat::make('Today', $data['today'])
                ->description($data['week'].' this week')
                ->descriptionIcon('heroicon-m-document-text')
                ->chart($data['series'])
                ->color($data['today'] > 0 ? 'success' : 'gray'),

            Stat::make('This month', $data['month'])
                ->description('articles published')
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('primary'),

            Stat::make(
                'Since last publish',
                $daysSince === null ? '—' : ($daysSince === 0 ? 'today' : $daysSince.($daysSince === 1 ? ' day' : ' days')),
            )
                ->description($last ? $last->format('d.m.Y H:i') : 'nothing published yet')
                ->descriptionIcon('heroicon-m-clock')
                // Google News drops a publisher that goes quiet. Three days is
                // a slow week; seven is a problem somebody should know about.
                ->color(match (true) {
                    $daysSince === null => 'gray',
                    $daysSince >= 7 => 'danger',
                    $daysSince >= 3 => 'warning',
                    default => 'success',
                }),
        ];
    }

    /**
     * One bar per day for a fortnight, oldest first.
     *
     * Two weeks rather than thirty days on purpose: at this size the sparkline
     * is about forty pixels wide, and thirty points in forty pixels is a
     * texture, not a chart.
     */
    private function last14Days(): array
    {
        $rows = Article::query()
            ->where('status', 'published')
            ->where('published_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(published_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->pluck('c', 'd');

        return collect(range(13, 0))
            ->map(fn ($back) => (int) ($rows[now()->subDays($back)->toDateString()] ?? 0))
            ->all();
    }
}
