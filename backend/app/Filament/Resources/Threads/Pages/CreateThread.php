<?php

namespace App\Filament\Resources\Threads\Pages;

use App\Filament\Resources\Threads\ThreadResource;
use Filament\Resources\Pages\CreateRecord;

class CreateThread extends CreateRecord
{
    protected static string $resource = ThreadResource::class;
}
