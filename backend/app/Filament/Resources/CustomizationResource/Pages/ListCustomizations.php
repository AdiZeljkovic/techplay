<?php

namespace App\Filament\Resources\CustomizationResource\Pages;

use App\Filament\Resources\CustomizationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListCustomizations extends ListRecords
{
    protected static string $resource = CustomizationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
