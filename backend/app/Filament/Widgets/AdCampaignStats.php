<?php

namespace App\Filament\Widgets;

use App\Models\AdCampaign;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AdCampaignStats extends BaseWidget
{
    protected static ?int $sort = 2;

    protected function getStats(): array
    {
        $totalViews = AdCampaign::sum('view_count');
        $totalClicks = AdCampaign::sum('click_count');
        $activeCampaigns = AdCampaign::active()->count();

        // Calculate overall CTR
        $overallCtr = $totalViews > 0 ? round(($totalClicks / $totalViews) * 100, 2) : 0;

        // Calculate total estimated revenue (DB aggregate — avoids loading all models into memory)
        $totalRevenue = AdCampaign::whereNotNull('cpm_price')
            ->where('cpm_price', '>', 0)
            ->where('view_count', '>', 0)
            ->selectRaw('SUM(view_count / 1000.0 * cpm_price) as total')
            ->value('total') ?? 0;

        // Get views trend (last 7 active campaigns)
        $viewsTrend = AdCampaign::active()
            ->orderBy('view_count', 'desc')
            ->take(7)
            ->pluck('view_count')
            ->toArray();

        return [
            Stat::make('Total Impressions', number_format($totalViews))
                ->description('All ad views')
                ->descriptionIcon('heroicon-m-eye')
                ->chart($viewsTrend ?: [0])
                ->color('primary'),

            Stat::make('Total Clicks', number_format($totalClicks))
                ->description("CTR: {$overallCtr}%")
                ->descriptionIcon('heroicon-m-cursor-arrow-rays')
                ->color($overallCtr > 5 ? 'success' : ($overallCtr > 2 ? 'warning' : 'danger')),

            Stat::make('Estimated Revenue', number_format($totalRevenue, 2).' KM')
                ->description('CPM-based calculation')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('success'),

            Stat::make('Active Campaigns', $activeCampaigns)
                ->description('Currently running')
                ->descriptionIcon('heroicon-m-megaphone')
                ->color('info'),
        ];
    }
}
