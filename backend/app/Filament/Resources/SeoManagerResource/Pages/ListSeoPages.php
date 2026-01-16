<?php

namespace App\Filament\Resources\SeoManagerResource\Pages;

use App\Filament\Resources\SeoManagerResource;
use Filament\Resources\Pages\ListRecords;

class ListSeoPages extends ListRecords
{
    protected static string $resource = SeoManagerResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTitle(): string
    {
        return 'Page SEO Manager';
    }

    public function getSubheading(): ?string
    {
        return 'Manage meta titles, descriptions, and indexing for all pages';
    }
}
