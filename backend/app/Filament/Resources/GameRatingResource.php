<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GameRatingResource\Pages;
use App\Models\GameRating;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Moderation surface for community game ratings & reviews — before this,
 * user-written reviews had no admin visibility at all.
 */
class GameRatingResource extends Resource
{
    /**
     * Hidden while the table is empty.
     *
     * The screen still exists and still works — this only keeps a row out of a
     * sidebar of forty-two, where a permanent zero is a row the eye learns to
     * skip. It comes back on its own with the first record.
     */
    public static function shouldRegisterNavigation(): bool
    {
        return static::getModel()::query()->exists();
    }

    protected static ?string $model = GameRating::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-hand-thumb-up';

    protected static ?string $navigationLabel = 'Game Ratings';

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['user']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    protected static ?int $navigationSort = 20;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'username')
                    ->disabled(),
                Forms\Components\TextInput::make('game_slug')
                    ->disabled(),
                Forms\Components\Select::make('rating')
                    ->options([1 => '1', 2 => '2', 3 => '3', 4 => '4', 5 => '5'])
                    ->required(),
                Forms\Components\Textarea::make('review')
                    ->rows(5)
                    ->maxLength(1000)
                    ->nullable(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.username')->label('User')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('game_slug')->label('Game')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('rating')->badge()->sortable()
                    ->color(fn (int $state): string => match (true) {
                        $state >= 4 => 'success',
                        $state === 3 => 'warning',
                        default => 'danger',
                    }),
                Tables\Columns\TextColumn::make('review')->limit(60)->searchable()->wrap(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('rating')
                    ->options([1 => '1★', 2 => '2★', 3 => '3★', 4 => '4★', 5 => '5★']),
                Tables\Filters\TernaryFilter::make('has_review')
                    ->label('Has written review')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('review'),
                        false: fn ($query) => $query->whereNull('review'),
                    ),
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

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGameRatings::route('/'),
            'edit' => Pages\EditGameRating::route('/{record}/edit'),
        ];
    }
}
