<?php

namespace App\Filament\Resources\BrokenLinkResource\Pages;

use App\Filament\Resources\BrokenLinkResource;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Artisan;
use App\Filament\Widgets\BrokenLinksPulse;

class ListBrokenLinks extends ListRecords
{
    protected static string $resource = BrokenLinkResource::class;

    protected function getHeaderActions(): array
    {
        return [
            /*
             * The scan runs weekly on its own. This is for the moment after you
             * have fixed something and want the list to agree with you, without
             * waiting until Sunday.
             */
            Action::make('scan')
                ->label('Scan articles now')
                ->icon('heroicon-m-magnifying-glass')
                ->color('gray')
                ->requiresConfirmation()
                ->modalHeading('Scan for broken links')
                ->modalDescription('Checks every link in the 40 most recently updated published articles. Takes a minute or two.')
                ->modalSubmitActionLabel('Scan')
                ->action(function (): void {
                    Artisan::call('seo:scan-links', ['--limit' => 40]);

                    Notification::make()
                        ->title('Scan finished')
                        ->body('The list below is up to date.')
                        ->success()
                        ->send();
                }),
        ];
    }

    /** @return array<int, class-string> */
    protected function getHeaderWidgets(): array
    {
        return [BrokenLinksPulse::class];
    }
}
