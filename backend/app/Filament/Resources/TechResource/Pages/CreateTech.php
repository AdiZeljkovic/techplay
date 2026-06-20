<?php

namespace App\Filament\Resources\TechResource\Pages;

use App\Filament\Resources\TechResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateTech extends CreateRecord
{
    protected static string $resource = TechResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
