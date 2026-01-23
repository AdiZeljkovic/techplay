<?php

namespace App\Filament\Resources\GiveawayResource\Pages;

use App\Filament\Resources\GiveawayResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Filament\Notifications\Notification;

class EditGiveaway extends EditRecord
{
    protected static string $resource = GiveawayResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('viewGiveaway')
                ->label('View Giveaway')
                ->icon('heroicon-o-eye')
                ->url(fn() => $this->record->getPublicUrl())
                ->openUrlInNewTab(),

            Actions\Action::make('copyLink')
                ->label('Copy Link')
                ->icon('heroicon-o-clipboard')
                ->action(function () {
                    Notification::make()
                        ->title('Link copied!')
                        ->body($this->record->getPublicUrl())
                        ->success()
                        ->send();
                })
                ->extraAttributes([
                    'x-on:click' => "navigator.clipboard.writeText('" . ($this->record?->getPublicUrl() ?? '') . "')",
                ]),

            Actions\DeleteAction::make(),
        ];
    }
}
