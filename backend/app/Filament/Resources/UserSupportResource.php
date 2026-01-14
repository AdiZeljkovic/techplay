<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserSupportResource\Pages;
use App\Models\UserSupport;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class UserSupportResource extends Resource
{
    protected static ?string $model = UserSupport::class;

    // protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static $navigationGroup = 'Shop & Monetization';
    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\Select::make('user_id')
                        ->relationship('user', 'username')
                        ->required(),
                    Forms\Components\Select::make('support_tier_id')
                        ->relationship('tier', 'name')
                        ->required(),
                    Forms\Components\TextInput::make('amount')
                        ->required()
                        ->numeric()
                        ->prefix('$'),
                    Forms\Components\Select::make('status')
                        ->options([
                                'active' => 'Active',
                                'expired' => 'Expired',
                                'cancelled' => 'Cancelled',
                            ])
                        ->required(),
                    Forms\Components\DateTimePicker::make('expires_at'),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('user.username')
                        ->numeric()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('tier.name')
                        ->numeric()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('amount')
                        ->numeric()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('status')
                        ->badge()
                        ->color(fn(string $state): string => match ($state) {
                            'active' => 'success',
                            'expired' => 'warning',
                            'cancelled' => 'danger',
                        }),
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
            'index' => Pages\ListUserSupports::route('/'),
            'create' => Pages\CreateUserSupport::route('/create'),
            'edit' => Pages\EditUserSupport::route('/{record}/edit'),
        ];
    }
}
