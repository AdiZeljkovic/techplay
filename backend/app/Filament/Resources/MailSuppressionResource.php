<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MailSuppressionResource\Pages;
use App\Models\MailSuppression;
use App\Policies\AdminOnlyPolicy;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Enums\Alignment;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Carbon;

/**
 * Addresses we must not write to.
 *
 * Read-mostly, and deliberately not a place to add people by hand — an address
 * lands here because somebody unsubscribed, a mailbox bounced, or a reader
 * pressed "report spam". Each of those is a fact recorded, not a decision made
 * in the panel.
 *
 * Removing a row is offered, because a bounce can be temporary and a person can
 * change their mind. Adding one is not: doing that by hand would be a way of
 * quietly dropping somebody from a list without a reason attached.
 */
class MailSuppressionResource extends Resource
{
    protected static ?string $model = MailSuppression::class;

    protected static ?string $modelPolicy = AdminOnlyPolicy::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-no-symbol';

    protected static ?string $slug = 'mail-suppressions';

    public static function getNavigationGroup(): ?string
    {
        return 'SEO & Marketing';
    }

    protected static ?int $navigationSort = 45;

    public static function getNavigationLabel(): string
    {
        return 'Do Not Mail';
    }

    public static function getModelLabel(): string
    {
        return 'suppressed address';
    }

    /**
     * The number worth seeing without opening the list: how many people we have
     * been told to stop writing to.
     */
    public static function getNavigationBadge(): ?string
    {
        $count = static::getModel()::count();

        return $count > 0 ? (string) $count : null;
    }

    public static function form(Schema $schema): Schema
    {
        // Nothing to edit. A suppression is a record of something that happened.
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('email')
                    ->label('Address')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                TextColumn::make('reason')
                    ->badge()
                    ->sortable()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        MailSuppression::UNSUBSCRIBED => 'Unsubscribed',
                        MailSuppression::BOUNCED => 'Bounced',
                        MailSuppression::COMPLAINED => 'Reported as spam',
                        default => ucfirst($state),
                    })
                    /*
                     * A complaint is the serious one — it is the reader telling
                     * their mailbox provider we are spam, and enough of them
                     * costs the sending domain its reputation. An unsubscribe is
                     * somebody exercising a right, which is not a problem.
                     */
                    ->color(fn (string $state) => match ($state) {
                        MailSuppression::COMPLAINED => 'danger',
                        MailSuppression::BOUNCED => 'warning',
                        default => 'gray',
                    }),

                TextColumn::make('source')
                    ->label('From')
                    ->placeholder('—')
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Since')
                    ->sortable()
                    ->alignment(Alignment::End)
                    ->formatStateUsing(function ($state) {
                        if (blank($state)) {
                            return '—';
                        }

                        $date = Carbon::parse($state);

                        return $date->gt(now()->subWeek())
                            ? $date->diffForHumans(short: true)
                            : $date->format('j M Y');
                    }),
            ])
            ->filters([
                SelectFilter::make('reason')
                    ->options([
                        MailSuppression::UNSUBSCRIBED => 'Unsubscribed',
                        MailSuppression::BOUNCED => 'Bounced',
                        MailSuppression::COMPLAINED => 'Reported as spam',
                    ]),
            ])
            ->recordActions([
                DeleteAction::make()
                    ->label('Allow again')
                    ->tooltip('Remove from the do-not-mail list')
                    ->iconButton()
                    ->modalHeading('Start writing to this address again?')
                    ->modalDescription('Only do this if you know they asked to come back. Sending to somebody who reported us as spam is how a sending domain loses its reputation.'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()->label('Allow again'),
                ]),
            ])
            ->emptyStateHeading('Nobody has asked us to stop')
            ->emptyStateDescription('Unsubscribes, bounces and spam reports land here, and every send checks this list first.');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMailSuppressions::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
