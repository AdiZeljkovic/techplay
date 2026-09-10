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

    /**
     * Straight to the edit screen, not back to the list.
     *
     * Preview, Send test and Send all need a saved campaign — there is no
     * record to render until there is one — so they live on the edit page. The
     * default redirect drops you on the list instead, where the only way back
     * to your own draft is to find its row, and the buttons you were looking
     * for are hidden behind a menu. Writing a newsletter and then looking at it
     * is one motion; this keeps it that way.
     */
    protected function getRedirectUrl(): string
    {
        return static::getResource()::getUrl('edit', ['record' => $this->getRecord()]);
    }
}
