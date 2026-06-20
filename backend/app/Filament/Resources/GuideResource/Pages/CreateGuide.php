<?php

namespace App\Filament\Resources\GuideResource\Pages;

use App\Filament\Resources\GuideResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateGuide extends CreateRecord
{
    protected static string $resource = GuideResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
