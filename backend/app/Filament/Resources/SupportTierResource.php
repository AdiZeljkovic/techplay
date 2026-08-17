<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SupportTierResource\Pages;
use App\Models\SupportTier;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class SupportTierResource extends Resource
{
    protected static ?string $model = SupportTier::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-heart';

    public static function getNavigationGroup(): ?string
    {
        return 'Shop & Monetization';
    }

    protected static ?int $navigationSort = 40;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Textarea::make('description')
                    ->rows(2)
                    ->placeholder('Kratki opis tier-a vidljiv korisnicima')
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('$'),
                Forms\Components\TextInput::make('currency')
                    ->required()
                    ->default('USD')
                    ->maxLength(3),
                Forms\Components\TextInput::make('paypal_plan_id')
                    ->label('PayPal Plan ID')
                    ->placeholder('P-XXXXXXXXXXXXXXXXXXXXXXXXXX')
                    ->maxLength(255)
                    ->helperText('ID PayPal subscription plana'),
                Forms\Components\Repeater::make('features')
                    ->simple(
                        Forms\Components\TextInput::make('feature')->required(),
                    )
                    ->columnSpanFull(),
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
