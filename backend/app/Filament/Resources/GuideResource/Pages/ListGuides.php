<?php

namespace App\Filament\Resources\GuideResource\Pages;

use App\Filament\Resources\GuideResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;
use App\Filament\Widgets\GuidesPulse;

class ListGuides extends ListRecords
{
    protected static string $resource = GuideResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [GuidesPulse::class];
    }
}
