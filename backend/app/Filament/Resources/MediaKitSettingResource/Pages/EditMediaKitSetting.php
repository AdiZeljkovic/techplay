<?php

namespace App\Filament\Resources\MediaKitSettingResource\Pages;

use App\Filament\Resources\MediaKitSettingResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditMediaKitSetting extends EditRecord
{
    protected static string $resource = MediaKitSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
