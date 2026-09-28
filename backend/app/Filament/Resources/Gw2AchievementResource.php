<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2AchievementResource\Pages;
use App\Models\Gw2Achievement;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Reviewing which achievements the advisor may recommend.
 *
 * The engine that finds them has been live since it shipped and has never been
 * able to speak with confidence, because `reviewed_at` is empty on all 8,339
 * rows — so every achievement recommendation carries a "not yet checked by us"
 * blocker, which costs it thirty per cent of its score and puts it below
 * everything else. On a typical account the achievements a single step from
 * done are the most actionable thing there is, and they sit at the bottom.
 *
 * §12.1 says what a review is for: exclude the deprecated, hidden, historical
 * and festival-locked, and attach an effort band rather than a fake minute
 * estimate.
 *
 * Nothing here edits ArenaNet's own fields. A catalogue refresh overwrites
 * those on every game build and deliberately leaves these three alone.
 */
class Gw2AchievementResource extends Resource
{
    protected static ?string $model = Gw2Achievement::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-trophy';

    protected static ?string $navigationLabel = 'GW2 Achievements';

    protected static ?int $navigationSort = 42;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    /** How many still need a person to look at them. */
    public static function getNavigationBadge(): ?string
    {
        $unreviewed = static::getModel()::whereNull('reviewed_at')->count();

        return $unreviewed > 0 ? number_format($unreviewed) : null;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\Placeholder::make('achievement')
                ->content(fn (Gw2Achievement $record) => $record->name),

            Forms\Components\Placeholder::make('requirement_text')
                ->label('Requirement')
                ->content(fn (Gw2Achievement $record) => $record->requirement ?: '—'),

            Forms\Components\Toggle::make('advisor_eligible')
                ->label('The advisor may recommend this')
                ->helperText('Off for anything deprecated, hidden, historical, or only reachable during a festival. Those are the ones §12.1 names.'),

            Forms\Components\Select::make('effort_band')
                ->options(Gw2Achievement::EFFORT_BANDS)
                ->helperText('A band, not minutes. The game reports the duration of nothing and people play at very different speeds.'),

            Forms\Components\DateTimePicker::make('reviewed_at')
                ->label('Reviewed')
                ->helperText('Until this is set the advisor tells the reader we have not checked it, and ranks it accordingly. Setting it is what makes the recommendation confident.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->sortable()->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable()->limit(44),
                Tables\Columns\TextColumn::make('requirement')->limit(52)->wrap()->toggleable(),
                Tables\Columns\TextColumn::make('type')->badge()->toggleable(),
                Tables\Columns\IconColumn::make('advisor_eligible')->label('Eligible')->boolean(),
                Tables\Columns\TextColumn::make('effort_band')->label('Effort')->badge()->placeholder('—'),
                Tables\Columns\TextColumn::make('reviewed_at')->dateTime()->placeholder('never')->sortable(),
            ])
            ->defaultSort('id')
            ->filters([
                Tables\Filters\TernaryFilter::make('reviewed_at')->label('Reviewed')->nullable(),
                Tables\Filters\TernaryFilter::make('advisor_eligible')->label('Eligible'),
                Tables\Filters\SelectFilter::make('effort_band')->options(Gw2Achievement::EFFORT_BANDS),
            ])
            ->actions([EditAction::make()])
            ->bulkActions([
                BulkActionGroup::make([
                    /*
                     * Reviewing 8,339 rows one at a time is not a plan. Most of
                     * a pass is "yes, this is fine"; the interesting decisions
                     * are the exclusions, and those are few.
                     */
                    BulkAction::make('approve')
                        ->label('Mark eligible and reviewed')
                        ->icon('heroicon-o-check')
                        ->requiresConfirmation()
                        ->action(fn ($records) => $records->each->update([
                            'advisor_eligible' => true,
                            'reviewed_at' => now(),
                        ])),

                    BulkAction::make('exclude')
                        ->label('Mark not eligible and reviewed')
                        ->icon('heroicon-o-x-mark')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->action(fn ($records) => $records->each->update([
                            'advisor_eligible' => false,
                            'reviewed_at' => now(),
                        ])),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Achievements::route('/'),
            'edit' => Pages\EditGw2Achievement::route('/{record}/edit'),
        ];
    }
}
