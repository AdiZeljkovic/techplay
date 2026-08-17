<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\NewsResource;
use App\Models\Article;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;

/**
 * Did anybody read it.
 *
 * The dashboard could say how many articles went out and not one word about
 * whether they landed. Sixteen published this month, and an editor closing the
 * panel knew exactly as much about their reach as when they opened it.
 *
 * ── What could not be built, and why ─────────────────────────────────────
 *
 * Not a traffic chart. There is no daily series anywhere in this database:
 * `article_reads` holds 32 rows because the per-visit logs were removed in
 * August, and no aggregate replaced them. `articles.views` is a running counter
 * with no history, so "views over time" cannot be drawn without inventing it.
 *
 * What a counter *can* answer is the shape of the month: how much reach the
 * work earned, and which piece earned most of it. That is three numbers, and
 * they are honest ones.
 *
 * The third is the one worth arguing for. An average hides everything — 215 per
 * article is true and tells you nothing, because half the catalogue sits near
 * zero and twenty-two pieces are over a thousand. Counting the pieces that
 * cleared a thousand says what an average cannot: **how often this newsroom
 * lands a hit.**
 */
class ReachPulse extends BaseWidget
{
    protected static ?int $sort = 3;

    protected ?string $heading = 'Reach';

    /**
     * Fifteen minutes.
     *
     * Views are flushed from Redis in batches, so a shorter window would show
     * the same number three times and then jump. This one costs three aggregate
     * queries over 625 rows.
     */
    protected function getStats(): array
    {
        $data = Cache::remember('dashboard.reach.v1', 900, function () {
            $published = Article::where('status', 'published');

            $best = (clone $published)
                ->where('published_at', '>=', now()->startOfMonth())
                ->orderByDesc('views')
                ->first(['id', 'title', 'views']);

            return [
                'total' => (int) (clone $published)->sum('views'),
                'count' => (clone $published)->count(),
                'month' => (int) (clone $published)->where('published_at', '>=', now()->startOfMonth())->sum('views'),
                'monthCount' => (clone $published)->where('published_at', '>=', now()->startOfMonth())->count(),
                'hits' => (clone $published)->where('views', '>', 1000)->count(),
                'bestId' => $best?->id,
                'bestTitle' => $best?->title,
                'bestViews' => (int) ($best?->views ?? 0),
            ];
        });

        $hitRate = $data['count'] > 0 ? round($data['hits'] / $data['count'] * 100) : 0;

        return [
            Stat::make('Article views', number_format($data['total']))
                ->description('across '.number_format($data['count']).' published')
                ->descriptionIcon('heroicon-m-eye')
                ->color('primary'),

            Stat::make('Earned this month', number_format($data['month']))
                ->description($data['monthCount'] > 0
                    ? 'from '.$data['monthCount'].' published this month'
                    : 'nothing published this month')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color($data['month'] > 0 ? 'success' : 'gray'),

            // The winner, named and linked. A number you cannot open is a number
            // you look at; this one is a piece you can go and learn from.
            $data['bestId']
                ? Stat::make('Best this month', number_format($data['bestViews']).' views')
                    ->description(mb_strimwidth((string) $data['bestTitle'], 0, 46, '…'))
                    ->descriptionIcon('heroicon-m-trophy')
                    ->url(NewsResource::getUrl('edit', ['record' => $data['bestId']]))
                    ->color('success')
                : Stat::make('Over 1,000 views', $data['hits'])
                    ->description($hitRate.'% of everything published')
                    ->descriptionIcon('heroicon-m-fire')
                    ->color('gray'),
        ];
    }

    /**
     * Three stats, three columns.
     *
     * Left to itself a stats widget spreads its cards over the dashboard's grid
     * and leaves a gap when it has fewer cards than columns — which is why the
     * first row of this dashboard used to be two cards and a third of empty
     * page. Saying the number out loud fixes it for every width.
     */
    public function getColumns(): int
    {
        return 3;
    }
}
