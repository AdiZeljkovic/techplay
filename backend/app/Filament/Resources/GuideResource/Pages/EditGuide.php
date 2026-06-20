<?php

namespace App\Filament\Resources\GuideResource\Pages;

use App\Filament\Resources\GuideResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditGuide extends EditRecord
{
    protected static string $resource = GuideResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
