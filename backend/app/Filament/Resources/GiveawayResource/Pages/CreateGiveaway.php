<?php

namespace App\Filament\Resources\GiveawayResource\Pages;

use App\Filament\Resources\GiveawayResource;
use Filament\Resources\Pages\CreateRecord;

class CreateGiveaway extends CreateRecord
{
    protected static string $resource = GiveawayResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
