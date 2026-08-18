<?php

namespace App\Filament\Resources\TechResource\Pages;

use App\Filament\Resources\TechResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;
use App\Filament\Widgets\TechPulse;

class ListTeches extends ListRecords
{
    protected static string $resource = TechResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [TechPulse::class];
    }
}
