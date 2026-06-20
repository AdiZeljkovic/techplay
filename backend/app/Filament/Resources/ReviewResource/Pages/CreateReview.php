<?php

namespace App\Filament\Resources\ReviewResource\Pages;

use App\Filament\Resources\ReviewResource;
use Filament\Resources\Pages\CreateRecord;
use Filament\Support\Enums\Width;

class CreateReview extends CreateRecord
{
    protected static string $resource = ReviewResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
