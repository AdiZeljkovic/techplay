<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use App\Filament\Widgets\MostViewedArticles;

class Analytics extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static string $view = 'filament.pages.analytics';

    protected static ?string $navigationGroup = 'System';

    protected static ?int $navigationSort = 100;

    protected function getHeaderWidgets(): array
    {
        return [
            MostViewedArticles::class,
        ];
    }
}
