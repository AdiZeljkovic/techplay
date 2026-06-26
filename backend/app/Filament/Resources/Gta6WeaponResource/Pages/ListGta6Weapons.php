<?php

namespace App\Filament\Resources\Gta6WeaponResource\Pages;

use App\Filament\Resources\Gta6WeaponResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGta6Weapons extends ListRecords
{
    protected static string $resource = Gta6WeaponResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
