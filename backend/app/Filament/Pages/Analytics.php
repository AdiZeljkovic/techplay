<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\MostViewedArticles;
use Filament\Pages\Page;

class Analytics extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-chart-bar';

    protected string $view = 'filament.pages.analytics';

    protected static string|\UnitEnum|null $navigationGroup = 'System';

    protected static ?int $navigationSort = 100;

    protected function getHeaderWidgets(): array
    {
        return [
            MostViewedArticles::class,
        ];
    }
}
