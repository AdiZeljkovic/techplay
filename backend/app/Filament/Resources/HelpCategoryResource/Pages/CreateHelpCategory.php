<?php

namespace App\Filament\Resources\HelpCategoryResource\Pages;

use App\Filament\Resources\HelpCategoryResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateHelpCategory extends CreateRecord
{
    protected static string $resource = HelpCategoryResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
