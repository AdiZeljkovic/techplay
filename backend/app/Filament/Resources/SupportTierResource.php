<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SupportTierResource\Pages;
use App\Models\SupportTier;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class SupportTierResource extends Resource
{
    protected static ?string $model = SupportTier::class;

    // protected static ?string $navigationIcon = 'heroicon-o-heart';

    public static function getNavigationGroup(): ?string
    {
        return 'Shop & Monetization';
    }
    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    Forms\Components\TextInput::make('price')
                        ->required()
                        ->numeric()
                        ->prefix('$'),
                    Forms\Components\TextInput::make('currency')
                        ->required()
                        ->default('USD')
                        ->maxLength(3),
                    Forms\Components\Repeater::make('features')
                        ->simple(
                            Forms\Components\TextInput::make('feature')->required(),
                        ),
                    Forms\Components\ColorPicker::make('color'),
                    Forms\Components\Toggle::make('is_active')
                        ->required(),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('name')
                        ->searchable(),
                    Tables\Columns\TextColumn::make('price')
                        ->money('USD')
                        ->sortable(),
                    Tables\Columns\IconColumn::make('is_active')
                        ->boolean(),
                    Tables\Columns\TextColumn::make('created_at')
                        ->dateTime()
                        ->sortable()
                        ->toggleable(isToggledHiddenByDefault: true),
                ])
            ->filters([
                    //
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
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportTiers::route('/'),
            'create' => Pages\CreateSupportTier::route('/create'),
            'edit' => Pages\EditSupportTier::route('/{record}/edit'),
        ];
    }
}
