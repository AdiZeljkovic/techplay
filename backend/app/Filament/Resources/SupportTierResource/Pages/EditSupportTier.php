<?php

namespace App\Filament\Resources\SupportTierResource\Pages;

use App\Filament\Resources\SupportTierResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSupportTier extends EditRecord
{
    protected static string $resource = SupportTierResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
