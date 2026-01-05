<?php

namespace App\Filament\Resources\UserSupportResource\Pages;

use App\Filament\Resources\UserSupportResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListUserSupports extends ListRecords
{
    protected static string $resource = UserSupportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
