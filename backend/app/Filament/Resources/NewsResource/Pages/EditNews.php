<?php

namespace App\Filament\Resources\NewsResource\Pages;

use App\Filament\Resources\NewsResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditNews extends EditRecord
{
    protected static string $resource = NewsResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
