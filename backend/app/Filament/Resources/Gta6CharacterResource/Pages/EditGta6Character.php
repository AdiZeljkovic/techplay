<?php

namespace App\Filament\Resources\Gta6CharacterResource\Pages;

use App\Filament\Resources\Gta6CharacterResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGta6Character extends EditRecord
{
    protected static string $resource = Gta6CharacterResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
