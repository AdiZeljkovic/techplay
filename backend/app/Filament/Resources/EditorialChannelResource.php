<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EditorialChannelResource\Pages;
use App\Models\EditorialChannel;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ColorColumn;
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
        return 'System';
    }

    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn (string $operation, $state, Set $set) => $operation === 'create' ? $set('slug', Str::slug($state)) : null),

                TextInput::make('slug')
                    ->required()
                    ->disabled()
                    ->dehydrated()
                    ->unique(EditorialChannel::class, 'slug', ignoreRecord: true),

                TextInput::make('description')
                    ->maxLength(255),

                TextInput::make('topic')
                    ->maxLength(255)
                    ->helperText('Quick topic shown in chat header (editable from chat too)'),

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
                    // Filament v5 hands closures Schemas\Components\Utilities\Get.
                    // The old Forms\Get type made this a TypeError the moment the
                    // form rendered, so the create page answered 500.
                    ->visible(fn (Get $get) => $get('is_private')),
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

                // Use TextColumn for icon since it may contain emojis
                TextColumn::make('icon')
                    ->label('Icon'),

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
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
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
