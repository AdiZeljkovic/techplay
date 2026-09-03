<?php

namespace App\Filament\Resources\HelpCategoryResource\Pages;

use App\Filament\Resources\HelpCategoryResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditHelpCategory extends EditRecord
{
    protected static string $resource = HelpCategoryResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
