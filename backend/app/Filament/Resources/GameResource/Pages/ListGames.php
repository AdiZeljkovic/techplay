<?php

namespace App\Filament\Resources\GameResource\Pages;

use App\Filament\Resources\GameResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;

class ListGames extends ListRecords
{
    protected static string $resource = GameResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
