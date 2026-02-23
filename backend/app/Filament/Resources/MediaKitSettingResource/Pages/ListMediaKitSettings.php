<?php

namespace App\Filament\Resources\MediaKitSettingResource\Pages;

use App\Filament\Resources\MediaKitSettingResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListMediaKitSettings extends ListRecords
{
    protected static string $resource = MediaKitSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
