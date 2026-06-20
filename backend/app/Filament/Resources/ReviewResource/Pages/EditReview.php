<?php

namespace App\Filament\Resources\ReviewResource\Pages;

use App\Filament\Resources\ReviewResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Enums\Width;

class EditReview extends EditRecord
{
    protected static string $resource = ReviewResource::class;

    public function getMaxContentWidth(): Width
    {
        return Width::Full;
    }
}
