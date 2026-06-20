<?php

namespace App\Filament\Resources\ReviewResource\Pages;

use App\Filament\Resources\ReviewResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Enums\Width;

class ListReviews extends ListRecords
{
    protected static string $resource = ReviewResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
