<?php

namespace App\Filament\Resources\Gw2RuleResource\Pages;

use App\Filament\Resources\Gw2RuleResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGw2Rule extends EditRecord
{
    protected static string $resource = Gw2RuleResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
