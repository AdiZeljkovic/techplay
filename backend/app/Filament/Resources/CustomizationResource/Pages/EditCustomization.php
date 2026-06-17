<?php

namespace App\Filament\Resources\CustomizationResource\Pages;

use App\Filament\Resources\CustomizationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCustomization extends EditRecord
{
    protected static string $resource = CustomizationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
