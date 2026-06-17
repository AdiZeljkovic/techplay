<?php

namespace App\Filament\Resources\UserGameResource\Pages;

use App\Filament\Resources\UserGameResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListUserGames extends ListRecords
{
    protected static string $resource = UserGameResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
