<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $revenue = Order::sum('total_price');
        $newUsers = User::where('created_at', '>=', now()->subDays(7))->count();
        $totalThreads = Thread::count();
        $totalPosts = Post::count();

        return [
            Stat::make('Total Revenue', number_format($revenue, 2) . ' KM')
                ->description('Lifetime earnings')
                ->descriptionIcon('heroicon-m-banknotes') // Use heroicon-m-... for v3
                ->color('success')
                ->chart([7, 2, 10, 3, 15, 4, 17]), // Fake chart for now

            Stat::make('New Users (7d)', $newUsers)
                ->description('Growth this week')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('primary'),

            Stat::make('Community Activity', $totalThreads + $totalPosts)
                ->description('Threads & Posts')
                ->descriptionIcon('heroicon-m-chat-bubble-left-right')
                ->color('warning'),
        ];
    }
}
