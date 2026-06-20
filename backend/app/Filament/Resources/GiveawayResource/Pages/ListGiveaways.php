<?php

namespace App\Filament\Resources\GiveawayResource\Pages;

use App\Filament\Resources\GiveawayResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGiveaways extends ListRecords
{
    protected static string $resource = GiveawayResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
