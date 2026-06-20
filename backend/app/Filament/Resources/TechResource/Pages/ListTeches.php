<?php

namespace App\Filament\Resources\TechResource\Pages;

use App\Filament\Resources\TechResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;

class ListTeches extends ListRecords
{
    protected static string $resource = TechResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
