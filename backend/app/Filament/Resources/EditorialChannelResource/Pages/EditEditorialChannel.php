<?php

namespace App\Filament\Resources\EditorialChannelResource\Pages;

use App\Filament\Resources\EditorialChannelResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditEditorialChannel extends EditRecord
{
    protected static string $resource = EditorialChannelResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
