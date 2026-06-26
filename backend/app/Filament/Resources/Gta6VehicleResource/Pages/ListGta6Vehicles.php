<?php

namespace App\Filament\Resources\Gta6VehicleResource\Pages;

use App\Filament\Resources\Gta6VehicleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGta6Vehicles extends ListRecords
{
    protected static string $resource = Gta6VehicleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
