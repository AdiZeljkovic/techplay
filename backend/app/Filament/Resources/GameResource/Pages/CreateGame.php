<?php

namespace App\Filament\Resources\GameResource\Pages;

use App\Filament\Resources\GameResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateGame extends CreateRecord
{
    protected static string $resource = GameResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
