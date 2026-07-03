<?php

namespace App\Filament\Resources\GameRatingResource\Pages;

use App\Filament\Resources\GameRatingResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditGameRating extends EditRecord
{
    protected static string $resource = GameRatingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
