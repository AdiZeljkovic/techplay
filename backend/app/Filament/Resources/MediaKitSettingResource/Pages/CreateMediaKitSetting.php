<?php

namespace App\Filament\Resources\MediaKitSettingResource\Pages;

use App\Filament\Resources\MediaKitSettingResource;
use Filament\Resources\Pages\CreateRecord;

class CreateMediaKitSetting extends CreateRecord
{
    protected static string $resource = MediaKitSettingResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
