<?php

namespace App\Filament\Resources\SupportTierResource\Pages;

use App\Filament\Resources\SupportTierResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSupportTiers extends ListRecords
{
    protected static string $resource = SupportTierResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
