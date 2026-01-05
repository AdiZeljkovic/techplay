<?php

namespace App\Filament\Resources\UserSupportResource\Pages;

use App\Filament\Resources\UserSupportResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditUserSupport extends EditRecord
{
    protected static string $resource = UserSupportResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
