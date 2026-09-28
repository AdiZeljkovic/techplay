<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2EventResource\Pages;
use App\Models\Gw2Event;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Entering the world boss and meta timetable.
 *
 * This screen exists because the data cannot come from anywhere else. The game's
 * API reports which bosses an account killed today and never when the next one
 * spawns, so the times are external knowledge — and a timetable typed from
 * memory is precisely the kind of invented data this tool has refused
 * everywhere else.
 *
 * So: the table ships empty, the panel on the site renders nothing until rows
 * exist, and a row reaches a reader only when it is both published and
 * verified. Those are two separate switches on purpose. Publishing is an editor
 * saying they meant it to be visible; verifying is somebody saying they checked
 * it against the game, with a note of where they checked. A wrong spawn time
 * sends a player to an empty map, which is worse than an empty panel.
 */
class Gw2EventResource extends Resource
{
    protected static ?string $model = Gw2Event::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clock';

    protected static ?string $navigationLabel = 'GW2 Event Times';

    protected static ?int $navigationSort = 41;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('name')
                ->required()
                ->maxLength(120)
                ->helperText('As the game names it, so a player can search for it.'),

            Forms\Components\TextInput::make('slug')
                ->required()
                ->maxLength(140)
                ->unique(ignoreRecord: true),

            Forms\Components\Select::make('kind')
                ->options([
                    'world_boss' => 'World boss',
                    'meta' => 'Meta event',
                    'festival' => 'Festival',
                ])
                ->required(),

            Forms\Components\TextInput::make('region')->maxLength(48),

            Forms\Components\TextInput::make('waypoint')
                ->maxLength(32)
                ->helperText('The chat code, e.g. [&BKgBAAA=]. It is what a player actually pastes.'),

            Forms\Components\TagsInput::make('daily_times_utc')
                ->helperText('Minutes past midnight UTC, one per daily spawn. 0 is 00:00 UTC, 90 is 01:30 UTC. UTC because the game resets on it — a reader\'s timezone is the browser\'s problem.')
                ->required(),

            Forms\Components\TextInput::make('duration_minutes')
                ->numeric()
                ->helperText('How long it runs, so the site can say whether it is on right now.'),

            Forms\Components\TextInput::make('rewards')->maxLength(200),

            Forms\Components\Toggle::make('is_published')
                ->helperText('You mean it to be visible.'),

            Forms\Components\DateTimePicker::make('verified_at')
                ->helperText('You checked these times against the game. Without this the row is never shown, however published it is.'),

            Forms\Components\TextInput::make('verified_source')
                ->maxLength(200)
                ->helperText('Where you checked. The next person to doubt a time should not have to start over.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('kind')->badge(),
                Tables\Columns\TextColumn::make('region')->placeholder('—'),
                Tables\Columns\TextColumn::make('daily_times_utc')
                    ->label('Spawns')
                    ->formatStateUsing(fn ($state) => is_array($state) ? count($state).'×/day' : '—'),
                Tables\Columns\IconColumn::make('is_published')->boolean(),
                Tables\Columns\TextColumn::make('verified_at')
                    ->dateTime()
                    ->placeholder('never — not shown')
                    ->sortable(),
            ])
            ->defaultSort('name')
            ->filters([
                Tables\Filters\SelectFilter::make('kind')->options([
                    'world_boss' => 'World boss',
                    'meta' => 'Meta event',
                    'festival' => 'Festival',
                ]),
                Tables\Filters\TernaryFilter::make('verified_at')
                    ->label('Verified')
                    ->nullable(),
            ])
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Events::route('/'),
            'create' => Pages\CreateGw2Event::route('/create'),
            'edit' => Pages\EditGw2Event::route('/{record}/edit'),
        ];
    }
}
