<?php

namespace App\Filament\Resources\Gta6WeaponResource\Pages;

use App\Filament\Resources\Gta6WeaponResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGta6Weapon extends EditRecord
{
    protected static string $resource = Gta6WeaponResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
