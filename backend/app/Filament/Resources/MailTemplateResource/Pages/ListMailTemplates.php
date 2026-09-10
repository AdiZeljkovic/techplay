<?php

namespace App\Filament\Resources\MailTemplateResource\Pages;

use App\Filament\Resources\MailTemplateResource;
use Filament\Resources\Pages\ListRecords;

class ListMailTemplates extends ListRecords
{
    protected static string $resource = MailTemplateResource::class;

    // No create action: the rows answer to keys the code asks for, and one
    // invented here would be a template nothing ever reads.
    protected function getHeaderActions(): array
    {
        return [];
    }
}
