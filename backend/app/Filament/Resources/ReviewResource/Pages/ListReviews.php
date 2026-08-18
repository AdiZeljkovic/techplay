<?php

namespace App\Filament\Resources\ReviewResource\Pages;

use App\Filament\Resources\ReviewResource;
use App\Filament\Widgets\ReviewsPulse;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;

class ListReviews extends ListRecords
{
    protected static string $resource = ReviewResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [ReviewsPulse::class];
    }
}
