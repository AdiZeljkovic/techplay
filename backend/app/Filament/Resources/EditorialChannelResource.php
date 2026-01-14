<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EditorialChannelResource\Pages;
use App\Models\EditorialChannel;
use Filament\Forms;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Columns\ColorColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class EditorialChannelResource extends Resource
{
    protected static ?string $model = EditorialChannel::class;

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-hashtag';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'System'; // Or 'Editorial Tools' if preferred
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    TextInput::make('name')
                        ->required()
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn(string $operation, $state, Forms\Set $set) => $operation === 'create' ? $set('slug', Str::slug($state)) : null),

                    TextInput::make('slug')
                        ->required()
                        ->disabled()
                        ->dehydrated()
                        ->unique(EditorialChannel::class, 'slug', ignoreRecord: true),

                    TextInput::make('description')
                        ->maxLength(255),

                    TextInput::make('icon')
                        ->default('heroicon-o-chat-bubble-left-right')
                        ->helperText('Heroicon name, e.g. heroicon-o-star'),

                    ColorPicker::make('color')
                        ->default('#3b82f6'),

                    TextInput::make('sort_order')
                        ->numeric()
                        ->default(0),

                    Toggle::make('is_private')
                        ->label('Private Channel')
                        ->reactive(),

                    Select::make('allowed_roles')
                        ->multiple()
                        ->options([
                                'Super Admin' => 'Super Admin',
                                'Editor-in-Chief' => 'Editor-in-Chief',
                                'Editor' => 'Editor',
                                'Journalist' => 'Journalist',
                                'Moderator' => 'Moderator',
                            ])
                        ->visible(fn(Forms\Get $get) => $get('is_private')),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    TextColumn::make('name')
                        ->searchable()
                        ->sortable(),

                    TextColumn::make('slug')
                        ->color('gray')
                        ->fontFamily('mono'),

                    ColorColumn::make('color'),

                    IconColumn::make('icon')
                        ->icon(fn(string $state): string => $state),

                    ToggleColumn::make('is_private'),

                    TextColumn::make('allowed_roles')
                        ->badge()
                        ->color('info')
                        ->listWithLineBreaks()
                        ->limitList(3),

                    TextColumn::make('sort_order')
                        ->sortable(),
                ])
            ->defaultSort('sort_order', 'asc')
            ->filters([
                    //
                ])
            ->actions([
                    Tables\Actions\EditAction::make(),
                    Tables\Actions\DeleteAction::make(),
                ])
            ->bulkActions([
                    Tables\Actions\BulkActionGroup::make([
                        Tables\Actions\DeleteBulkAction::make(),
                    ]),
                ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEditorialChannels::route('/'),
            'create' => Pages\CreateEditorialChannel::route('/create'),
            'edit' => Pages\EditEditorialChannel::route('/{record}/edit'),
        ];
    }
}
