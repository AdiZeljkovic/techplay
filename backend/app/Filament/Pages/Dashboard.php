<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\MostViewedArticles;
use App\Filament\Widgets\StatsOverview;
use App\Models\Article;
use App\Models\User;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected string $view = 'filament.pages.dashboard';

    public function getHeaderWidgets(): array
    {
        return [
            StatsOverview::class,
        ];
    }

    public function getFooterWidgets(): array
    {
        return [
            MostViewedArticles::class,
        ];
    }

    public function getDraftCount(): int
    {
        return Article::where('status', 'draft')->count();
    }

    public function getTodayCount(): int
    {
        return Article::whereDate('created_at', today())->count();
    }

    public function getPendingCount(): int
    {
        return Article::where('status', 'pending_review')->count();
    }

    public function getTotalUsers(): int
    {
        return User::count();
    }
}
