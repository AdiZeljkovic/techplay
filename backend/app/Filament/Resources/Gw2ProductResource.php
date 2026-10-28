<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2ProductResource\Pages;
use App\Models\Gw2Product;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Expansions and Living World seasons: what each grants, what it comes with,
 * and which `access` flag means an account owns it.
 *
 * This is the table that goes stale whenever ArenaNet changes the store — 13
 * October 2026 made Season 2 free and folded Seasons 3 to 5 into expansions in
 * one post. Every row names its source; change the row, change the source.
 */
class Gw2ProductResource extends Resource
{
    protected static ?string $model = Gw2Product::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'GW2 Expansions & Seasons';

    protected static ?int $navigationSort = 46;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('name')->required()->maxLength(120),
            Forms\Components\TextInput::make('key')->disabled()->dehydrated(false),
            Forms\Components\Select::make('kind')->options(['base' => 'Base game', 'expansion' => 'Expansion', 'living_world' => 'Living World'])->required(),
            Forms\Components\TagsInput::make('access_flags')
                ->helperText('`access` strings from /v2/account that mean the account owns this. Empty when the game does not report it.'),
            Forms\Components\TagsInput::make('included_with')
                ->helperText('Product keys whose ownership brings this along, e.g. path_of_fire.'),
            Forms\Components\Toggle::make('is_free'),
            Forms\Components\Textarea::make('grants')->rows(2),
            Forms\Components\TextInput::make('grants_source_url')->url()->maxLength(500),
            Forms\Components\TextInput::make('grants_source_label')->maxLength(200),
            Forms\Components\Textarea::make('note')->rows(2),
            Forms\Components\TextInput::make('source_url')->url()->maxLength(500)->required(),
            Forms\Components\TextInput::make('source_label')->maxLength(200)->required(),
            Forms\Components\DateTimePicker::make('checked_at')->label('Last checked'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name'),
                Tables\Columns\TextColumn::make('kind')->badge(),
                Tables\Columns\IconColumn::make('is_free')->boolean(),
                Tables\Columns\TextColumn::make('source_label')->limit(40),
                Tables\Columns\TextColumn::make('checked_at')->dateTime()->placeholder('never checked'),
            ])
            ->defaultSort('sort_order')
            ->actions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Products::route('/'),
            'edit' => Pages\EditGw2Product::route('/{record}/edit'),
        ];
    }
}
