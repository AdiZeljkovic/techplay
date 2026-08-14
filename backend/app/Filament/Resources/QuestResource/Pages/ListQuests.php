<?php

namespace App\Filament\Resources\QuestResource\Pages;

use App\Filament\Resources\QuestResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListQuests extends ListRecords
{
    protected static string $resource = QuestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
