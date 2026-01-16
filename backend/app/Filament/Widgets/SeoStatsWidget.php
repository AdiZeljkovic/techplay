<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use App\Models\BrokenLink;
use App\Services\InternalLinkService;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class SeoStatsWidget extends BaseWidget
{
    protected static ?string $pollingInterval = null;
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $totalArticles = Article::where('status', 'published')->count();
        $missingMeta = Article::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('meta_description')
                    ->orWhere('meta_description', '');
            })->count();

        $brokenLinks = BrokenLink::where('is_fixed', false)->count();

        // Orphan pages calculation (cached for performance)
        $orphanCount = cache()->remember('seo_orphan_count', 3600, function () {
            return count(InternalLinkService::findOrphanPages());
        });

        return [
            Stat::make('Published Articles', $totalArticles)
                ->description('Total indexed content')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('success'),

            Stat::make('Missing Meta', $missingMeta)
                ->description('Articles without meta description')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($missingMeta > 0 ? 'danger' : 'success'),

            Stat::make('Broken Links', $brokenLinks)
                ->description('Links returning errors')
                ->descriptionIcon('heroicon-m-link')
                ->color($brokenLinks > 0 ? 'warning' : 'success'),

            Stat::make('Orphan Pages', $orphanCount)
                ->description('Pages without internal links')
                ->descriptionIcon('heroicon-m-exclamation-circle')
                ->color($orphanCount > 0 ? 'warning' : 'success'),
        ];
    }
}
