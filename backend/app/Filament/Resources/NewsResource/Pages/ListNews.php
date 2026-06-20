<?php

namespace App\Filament\Resources\NewsResource\Pages;

use App\Filament\Resources\NewsResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;

class ListNews extends ListRecords
{
    protected static string $resource = NewsResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
