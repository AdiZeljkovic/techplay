<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DiscordStatsWidget extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Discord Linked Users', User::whereNotNull('discord_id')->count())
                ->description('Users with Discord integration')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('info'),

            Stat::make('Discord XP Share', User::whereNotNull('discord_id')->sum('xp'))
                ->description('Total XP from linked users')
                ->descriptionIcon('heroicon-m-bolt')
                ->color('warning'),

            Stat::make('Latest Discord Link', User::whereNotNull('discord_id')->latest()->first()?->username ?? 'None')
                ->description('Most recent integration')
                ->descriptionIcon('heroicon-m-link')
                ->color('success'),
        ];
    }
}
