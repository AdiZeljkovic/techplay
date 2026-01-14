<?php

namespace App\Filament\Resources\EditorialChannelResource\Pages;

use App\Filament\Resources\EditorialChannelResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListEditorialChannels extends ListRecords
{
    protected static string $resource = EditorialChannelResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
