<?php

namespace App\Filament\Resources\TechResource\Pages;

use App\Filament\Resources\TechResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditTech extends EditRecord
{
    protected static string $resource = TechResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
