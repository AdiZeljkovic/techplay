<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2SourceResource\Pages;
use App\Models\Gw2Source;
use App\Services\Gw2\Wiki;
use App\Services\Gw2\WikiPages;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Where the advisor's claims come from.
 *
 * §18.2 calls this the source registry and §25 lists provenance as the first
 * control on the product's largest risk: a wrong recommendation in front of an
 * audience that knows Guild Wars 2 better than we do. A rule that turns out
 * wrong should be traceable to what it was based on, and by whom.
 *
 * `checked_at` is the field that matters most and is easiest to leave empty. A
 * source is not a citation, it is something that can go stale — a wiki link
 * nobody has opened since the last balance patch is worse than no link at all,
 * because it looks like diligence.
 *
 * `measured` is a first-class kind here and arguably the strongest: most of
 * what this advisor claims was measured against the live API rather than read
 * anywhere, and a measurement is the only kind of source that can be re-run.
 */
class Gw2SourceResource extends Resource
{
    protected static ?string $model = Gw2Source::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $navigationLabel = 'GW2 Rule Sources';

    protected static ?int $navigationSort = 44;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('label')->required()->maxLength(120),

            Forms\Components\TextInput::make('url')
                ->required()
                ->maxLength(500)
                ->helperText('A URL, or an internal:// marker for something measured or decided here rather than read.'),

            Forms\Components\Select::make('kind')
                ->options(Gw2Source::KINDS)
                ->required()
                ->default('wiki'),

            Forms\Components\DateTimePicker::make('checked_at')
                ->label('Last checked')
                ->helperText('When somebody last opened it and agreed it still says what the rules claim. An unchecked source looks like diligence and is not.'),

            Forms\Components\Textarea::make('notes')->rows(3),

            Forms\Components\TextInput::make('subject')
                ->disabled()
                ->dehydrated(false)
                ->visible(fn (?Gw2Source $record) => (bool) $record?->subject)
                ->helperText('This row is the wiki link for that raid, dungeon or boss. Readers see it only once it is checked — use "Check page" in the list.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('label')->searchable()->limit(50)->wrap(),
                Tables\Columns\TextColumn::make('kind')->badge(),
                Tables\Columns\TextColumn::make('subject')->color('gray')->placeholder('citation')->toggleable(),
                Tables\Columns\TextColumn::make('url')->limit(40)->color('gray')->url(fn (Gw2Source $r) => str_starts_with($r->url, 'http') ? $r->url : null, true),
                Tables\Columns\TextColumn::make('checked_at')
                    ->dateTime()
                    ->placeholder('never checked')
                    ->sortable(),
            ])
            ->defaultSort('checked_at', 'asc')
            ->filters([
                Tables\Filters\SelectFilter::make('kind')->options(Gw2Source::KINDS),
                Tables\Filters\TernaryFilter::make('checked_at')->label('Checked')->nullable(),
                Tables\Filters\TernaryFilter::make('subject')
                    ->label('Wiki page for a raid, dungeon or boss')
                    ->nullable(),
            ])
            ->actions([self::checkAction(), EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    /**
     * Open the page and confirm it — for the rows that become reader links.
     *
     * A raid, dungeon or world boss gets a wiki link only once this has been
     * done (`WikiPages`). The modal shows what the page calls itself, read from
     * its title, because a slug-made URL can land on a disambiguation page or
     * on some other thing with the same word — and only a person looking at the
     * title can tell "Dhuum" is right for `voice_in_the_void`.
     */
    private static function checkAction(): Action
    {
        return Action::make('check')
            ->label('Check page')
            ->icon('heroicon-o-magnifying-glass')
            ->color('gray')
            ->visible(fn (Gw2Source $r) => str_starts_with($r->url, Wiki::BASE.'/wiki/'))
            ->requiresConfirmation()
            ->modalHeading('Is this the right page?')
            ->modalDescription(function (Gw2Source $record) {
                $page = app(WikiPages::class)->title($record->url);

                return $page['ok']
                    ? "The wiki calls this page \"{$page['title']}\". Confirm only if that is the page for {$record->label}."
                    : 'Cannot confirm it now. '.$page['reason'].($page['title'] ? " (Title: \"{$page['title']}\")" : '');
            })
            ->modalSubmitActionLabel('Yes, mark it checked')
            ->action(function (Gw2Source $record) {
                // Read again rather than trusting the modal: a page that went
                // down between the two must not be confirmed.
                $page = app(WikiPages::class)->title($record->url);

                if (! $page['ok']) {
                    Notification::make()->title('Not checked')->body($page['reason'])->danger()->send();

                    return;
                }

                $record->update([
                    'checked_at' => now(),
                    'notes' => trim(($record->notes ? $record->notes."\n" : '').'Checked '.now()->toDateString().': the page is "'.$page['title'].'".'),
                ]);

                Notification::make()->title('Checked: '.$page['title'])->success()->send();
            });
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Sources::route('/'),
            'create' => Pages\CreateGw2Source::route('/create'),
            'edit' => Pages\EditGw2Source::route('/{record}/edit'),
        ];
    }
}
