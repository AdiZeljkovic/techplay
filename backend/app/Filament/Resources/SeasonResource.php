<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SeasonResource\Pages;
use App\Models\Season;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

/**
 * Seasons had no admin surface at all.
 *
 * There was exactly one — "Summer of Gaming 2026", ending 21 September — and
 * nothing anywhere creates another: not a command, not a controller, only a
 * seeder hardcoded to that one slug. `season:conclude` runs nightly, flips
 * `is_active` off when the end date passes, and stops there. From the morning
 * after, `Season::active()` returns null, seasonal quests drop out of
 * /quests, and the XP and bounty multipliers quietly fall back to 1.0 with
 * nobody able to start the next one without a database console.
 */
class SeasonResource extends Resource
{
    protected static ?string $model = Season::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clock';

    public static function getNavigationGroup(): ?string
    {
        return 'Gamification';
    }

    protected static ?int $navigationSort = 30;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn (?string $state, Set $set) => filled($state) ? $set('slug', Str::slug($state)) : null),

                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->maxLength(255)
                    ->unique(ignoreRecord: true)
                    ->helperText('Used by the API. Changing it on a running season breaks existing links.'),

                Forms\Components\Textarea::make('description')
                    ->rows(3)
                    ->columnSpanFull(),

                Forms\Components\DatePicker::make('start_date')
                    ->required()
                    ->helperText('A season is live between these dates AND while the toggle below is on.'),

                Forms\Components\DatePicker::make('end_date')
                    ->required()
                    ->afterOrEqual('start_date'),

                Forms\Components\TextInput::make('xp_multiplier')
                    ->required()
                    ->numeric()
                    ->default(1.0)
                    ->minValue(0.1)
                    ->maxValue(10)
                    ->step(0.05)
                    ->helperText('1.00 = no boost.'),

                Forms\Components\TextInput::make('bounty_multiplier')
                    ->required()
                    ->numeric()
                    ->default(1.0)
                    ->minValue(0.1)
                    ->maxValue(10)
                    ->step(0.05),

                Forms\Components\TextInput::make('cover_image')
                    ->maxLength(255)
                    ->url(),

                Forms\Components\TextInput::make('badge_image')
                    ->maxLength(255)
                    ->url()
                    ->helperText('Awarded as a profile badge when season:conclude runs.'),

                Forms\Components\Toggle::make('is_active')
                    ->helperText('Two overlapping active seasons is a mistake that takes thirty seconds to make. The list marks which one the site is actually serving.')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->description(fn (Season $record) => $record->slug),

                // The flag alone lies when two seasons overlap, so the table
                // states which one Season::active() actually resolves to.
                Tables\Columns\TextColumn::make('standing')
                    ->label('Standing')
                    ->badge()
                    ->state(fn (Season $record) => match (true) {
                        Season::active()?->is($record) ?? false => 'Live now',
                        (bool) $record->is_active => 'Flagged, not live',
                        default => 'Closed',
                    })
                    ->color(fn (string $state) => match ($state) {
                        'Live now' => 'success',
                        'Flagged, not live' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('start_date')->date()->sortable(),
                Tables\Columns\TextColumn::make('end_date')->date()->sortable(),

                Tables\Columns\TextColumn::make('xp_multiplier')
                    ->label('XP ×')
                    ->numeric(2),

                Tables\Columns\TextColumn::make('bounty_multiplier')
                    ->label('Bounty ×')
                    ->numeric(2),

                Tables\Columns\TextColumn::make('quests_count')
                    ->label('Quests')
                    ->counts('quests'),
            ])
            ->defaultSort('start_date', 'desc')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')->label('Flagged active'),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSeasons::route('/'),
            'create' => Pages\CreateSeason::route('/create'),
            'edit' => Pages\EditSeason::route('/{record}/edit'),
        ];
    }
}
