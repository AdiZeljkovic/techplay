<?php

namespace App\Filament\Resources\HelpArticleResource\Pages;

use App\Filament\Resources\HelpArticleResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditHelpArticle extends EditRecord
{
    protected static string $resource = HelpArticleResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
