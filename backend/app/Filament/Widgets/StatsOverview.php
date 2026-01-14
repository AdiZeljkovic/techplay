<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use App\Models\Order;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Users', User::count())
                ->description('Active registered users')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->chart([7, 2, 10, 3, 15, 4, 17])
                ->color('primary'),

            Stat::make('Published Articles', Article::where('status', 'published')->count())
                ->description('Content available efficiently')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('success'),

            Stat::make('Total Revenue', number_format(Order::where('status', 'completed')->sum('total_price'), 2) . ' KM')
                ->description('Lifetime earnings')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->chart([15, 4, 10, 2, 12, 4, 12])
                ->color('warning'),
        ];
    }
}
