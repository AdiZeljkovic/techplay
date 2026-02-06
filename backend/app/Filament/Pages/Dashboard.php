<?php

namespace App\Filament\Pages;

use App\Models\Article;
use App\Models\User;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static string $view = 'filament.pages.dashboard';

    public function getHeaderWidgets(): array
    {
        return [
            \App\Filament\Widgets\StatsOverview::class,
        ];
    }

    public function getFooterWidgets(): array
    {
        return [
            \App\Filament\Widgets\MostViewedArticles::class,
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
