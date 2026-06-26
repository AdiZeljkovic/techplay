<?php

namespace App\Filament\Resources\Gta6CharacterResource\Pages;

use App\Filament\Resources\Gta6CharacterResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGta6Characters extends ListRecords
{
    protected static string $resource = Gta6CharacterResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
