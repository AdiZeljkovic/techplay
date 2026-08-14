<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use Filament\Facades\Filament;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $stats = [
            Stat::make('Total Users', User::count())
                ->description('Active registered users')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->chart($this->dailySeries(User::query()))
                ->color('primary'),

            Stat::make('Published Articles', Article::where('status', 'published')->count())
                ->description('Live on the site')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('success'),
        ];

        // Revenue is the one number on this dashboard that the policy tiers
        // deliberately withhold: OrderResource is AdminOnlyPolicy. The widget
        // was handing it to every panel user — a Moderator could not open
        // Orders but read lifetime earnings on the way past.
        $user = Filament::auth()->user();

        if ($user?->isAdmin()) {
            $stats[] = Stat::make(
                'Total Revenue',
                number_format((float) Order::where('status', 'completed')->sum('total_price'), 2).' KM'
            )
                ->description('Lifetime earnings')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->chart($this->dailySeries(Order::where('status', 'completed'), 'total_price'))
                ->color('warning');
        }

        return $stats;
    }

    /**
     * Seven days of real numbers.
     *
     * The two charts here used to be literal arrays — [7, 2, 10, 3, 15, 4, 17]
     * under Total Users and [15, 4, 10, 2, 12, 4, 12] under Total Revenue.
     * Both drew a confident upward line that described nothing, on the one
     * screen the team reads before deciding anything.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<*>  $query
     * @return array<int, float>
     */
    protected function dailySeries($query, ?string $sumColumn = null): array
    {
        $model = $query->getModel();
        $key = 'admin:sparkline:'.class_basename($model).':'.($sumColumn ?? 'count');

        return Cache::remember($key, now()->addMinutes(15), function () use ($query, $sumColumn) {
            $from = Carbon::today()->subDays(6);

            $rows = $query
                ->where('created_at', '>=', $from)
                ->selectRaw('DATE(created_at) AS bucket, '.($sumColumn ? "SUM({$sumColumn})" : 'COUNT(*)').' AS value')
                ->groupBy('bucket')
                ->pluck('value', 'bucket');

            // Days with nothing in them are zeroes, not gaps — a series that
            // skips empty days flatters a quiet week into a busy one.
            return collect(range(0, 6))
                ->map(fn (int $i) => (float) ($rows[$from->copy()->addDays($i)->toDateString()] ?? 0))
                ->all();
        });
    }
}
