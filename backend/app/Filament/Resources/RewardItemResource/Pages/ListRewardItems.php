<?php

namespace App\Filament\Resources\RewardItemResource\Pages;

use App\Filament\Resources\RewardItemResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRewardItems extends ListRecords
{
    protected static string $resource = RewardItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
