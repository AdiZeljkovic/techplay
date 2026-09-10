<?php

namespace App\Filament\Resources\MailCampaignResource\Pages;

use App\Filament\Resources\MailCampaignResource;
use App\Models\MailCampaign;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Auth;

class CreateMailCampaign extends CreateRecord
{
    protected static string $resource = MailCampaignResource::class;

    /**
     * Everything starts as a draft.
     *
     * There is no form field for the status and there should not be one:
     * "sent" is a thing that happens to a campaign, not a thing somebody types
     * into it, and a dropdown offering it would be a way to mark a newsletter
     * as sent without having sent it.
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['status'] = MailCampaign::DRAFT;
        $data['created_by'] = Auth::id();

        return $data;
    }
}
