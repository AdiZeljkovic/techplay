<?php

namespace App\Filament\Resources\MailCampaignResource\Pages;

use App\Filament\Resources\MailCampaignResource;
use Filament\Resources\Pages\EditRecord;

class EditMailCampaign extends EditRecord
{
    protected static string $resource = MailCampaignResource::class;

    protected function getHeaderActions(): array
    {
        return [
            MailCampaignResource::previewAction(),
            MailCampaignResource::testAction(),
            MailCampaignResource::sendAction(),
        ];
    }
}
