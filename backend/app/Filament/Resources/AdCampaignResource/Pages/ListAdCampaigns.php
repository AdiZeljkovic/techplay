<?php

namespace App\Filament\Resources\AdCampaignResource\Pages;

use App\Filament\Resources\AdCampaignResource;
use App\Filament\Widgets\AdCampaignStats;
use App\Filament\Widgets\TopPerformingAds;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAdCampaigns extends ListRecords
{
    protected static string $resource = AdCampaignResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            AdCampaignStats::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            TopPerformingAds::class,
        ];
    }
}
