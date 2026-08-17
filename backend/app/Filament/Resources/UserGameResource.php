<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserGameResource\Pages;
use App\Models\UserGame;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class UserGameResource extends Resource
{
    protected static ?string $model = UserGame::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Game Collections';

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
        return parent::getEloquentQuery()->with(['game', 'user']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Gamification';
    }

    protected static ?int $navigationSort = 80;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'username')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\Select::make('game_id')
                    ->relationship('game', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\Select::make('status')
                    ->options(array_combine(UserGame::STATUSES, array_map('ucfirst', UserGame::STATUSES)))
                    ->default('backlog')
                    ->required(),
                Forms\Components\Toggle::make('is_favorite'),
                Forms\Components\TextInput::make('progress')
                    ->numeric()->minValue(0)->maxValue(100)->default(0)->suffix('%'),
                Forms\Components\TextInput::make('hours_played')
                    ->numeric()->minValue(0)->default(0),
                Forms\Components\TextInput::make('platform')
                    ->maxLength(60),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('user.username')->label('User')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('game.name')->label('Game')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('status')->badge()->sortable(),
                Tables\Columns\IconColumn::make('is_favorite')->boolean(),
                Tables\Columns\TextColumn::make('progress')->suffix('%')->sortable(),
                Tables\Columns\TextColumn::make('hours_played')->label('Hours')->sortable(),
                Tables\Columns\TextColumn::make('updated_at')->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(array_combine(UserGame::STATUSES, array_map('ucfirst', UserGame::STATUSES))),
            ])
            ->actions([
                ViewAction::make(),
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
            'index' => Pages\ListUserGames::route('/'),
            'create' => Pages\CreateUserGame::route('/create'),
            'edit' => Pages\EditUserGame::route('/{record}/edit'),
        ];
    }
}
