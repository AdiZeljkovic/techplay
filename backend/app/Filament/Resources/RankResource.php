<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RankResource\Pages;
use App\Models\Rank;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class RankResource extends Resource
{
    protected static ?string $model = Rank::class;

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }
    protected static ?int $navigationSort = 6;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('min_xp')
                    ->label('Minimum XP')
                    ->required()
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('icon')
                    ->placeholder('e.g., 🎮 or heroicon-o-star')
                    ->maxLength(255),
                Forms\Components\ColorPicker::make('color'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('min_xp')
                    ->label('XP Required')
                    ->sortable(),
                Tables\Columns\TextColumn::make('icon'),
                Tables\Columns\ColorColumn::make('color'),
                Tables\Columns\TextColumn::make('users_count')
                    ->counts('users')
                    ->label('Users'),
            ])
            ->defaultSort('min_xp', 'asc')
            ->filters([])
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
            'index' => Pages\ListRanks::route('/'),
            'create' => Pages\CreateRank::route('/create'),
            'edit' => Pages\EditRank::route('/{record}/edit'),
        ];
    }
}
