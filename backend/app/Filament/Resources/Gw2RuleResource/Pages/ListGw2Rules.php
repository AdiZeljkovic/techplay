<?php

namespace App\Filament\Resources\Gw2RuleResource\Pages;

use App\Filament\Resources\Gw2RuleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGw2Rules extends ListRecords
{
    protected static string $resource = Gw2RuleResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
