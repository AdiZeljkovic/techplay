<?php

namespace App\Filament\Resources\RewardItemResource\Pages;

use App\Filament\Resources\RewardItemResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditRewardItem extends EditRecord
{
    protected static string $resource = RewardItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
