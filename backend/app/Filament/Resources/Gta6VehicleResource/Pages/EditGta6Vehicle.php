<?php

namespace App\Filament\Resources\Gta6VehicleResource\Pages;

use App\Filament\Resources\Gta6VehicleResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGta6Vehicle extends EditRecord
{
    protected static string $resource = Gta6VehicleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
