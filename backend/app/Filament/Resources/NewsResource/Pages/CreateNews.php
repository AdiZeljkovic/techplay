<?php

namespace App\Filament\Resources\NewsResource\Pages;

use App\Filament\Resources\NewsResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateNews extends CreateRecord
{
    protected static string $resource = NewsResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
