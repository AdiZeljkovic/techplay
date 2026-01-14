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

class SiteSettingResource extends Resource
{
    protected static ?string $model = SiteSetting::class;

    protected static ?string $navigationLabel = 'Site Settings';

    protected static ?string $navigationGroup = 'System';
    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('key')
                        ->required()
                        ->disabled()
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
                                'image' => 'Image URL',
                                'json' => 'JSON',
                            ])
                        ->required(),
                    Forms\Components\Textarea::make('value')
                        ->rows(3)
                        ->columnSpanFull(),
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
