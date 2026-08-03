<?php

namespace App\Filament\Resources\ClanMissionTemplateResource\Pages;

use App\Filament\Resources\ClanMissionTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListClanMissionTemplates extends ListRecords
{
    protected static string $resource = ClanMissionTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
