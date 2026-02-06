<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteSettingResource\Pages;
use App\Models\SiteSetting;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Forms\Get;

class SiteSettingResource extends Resource
{
    protected static ?string $model = SiteSetting::class;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = 'Site Settings';

    public static function getNavigationGroup(): ?string
    {
        return 'System';
    }
    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('key')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Select::make('group')
                    ->options([
                        'general' => 'General',
                        'socials' => 'Social Media',
                        'contact' => 'Contact Info',
                    ])
                    ->required(),
                Forms\Components\Select::make('type')
                    ->options([
                        'text' => 'Text',
                        'boolean' => 'Boolean (Toggle)',
                        'image' => 'Image URL',
                        'json' => 'JSON',
                    ])
                    ->required()
                    ->live(),
                Forms\Components\Textarea::make('value')
                    ->rows(3)
                    ->columnSpanFull()
                    ->hidden(fn($get) => $get('type') === 'boolean'),
                Forms\Components\Toggle::make('value')
                    ->label('Enabled')
                    ->visible(fn($get) => $get('type') === 'boolean')
                    ->formatStateUsing(function ($state) {
                        return filter_var($state, FILTER_VALIDATE_BOOLEAN);
                    })
                    ->dehydrateStateUsing(fn($state) => $state ? '1' : '0'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('key')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('group')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'general' => 'info',
                        'socials' => 'success',
                        'contact' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('value')
                    ->limit(50),
                Tables\Columns\TextColumn::make('type'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('group')
                    ->options([
                        'general' => 'General',
                        'socials' => 'Social Media',
                        'contact' => 'Contact Info',
                    ]),
            ])
            ->actions([
                EditAction::make(),
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
            'index' => Pages\ListSiteSettings::route('/'),
            'create' => Pages\CreateSiteSetting::route('/create'),
            'edit' => Pages\EditSiteSetting::route('/{record}/edit'),
        ];
    }
}
