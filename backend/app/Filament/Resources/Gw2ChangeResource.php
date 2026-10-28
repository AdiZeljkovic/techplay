<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2ChangeResource\Pages;
use App\Models\Gw2Change;
use App\Models\Gw2Product;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * "What changed while you were away" — one dated row per change, in our own
 * words, with the page it was written from.
 *
 * The date is when the change went live, not when it was announced, unless the
 * row is itself an announcement. `applies_to` decides who sees it: a product
 * key, or `all`.
 */
class Gw2ChangeResource extends Resource
{
    protected static ?string $model = Gw2Change::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clock';

    protected static ?string $navigationLabel = 'GW2 What Changed';

    protected static ?int $navigationSort = 47;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\DatePicker::make('happened_on')->label('Went live on')->required(),
            Forms\Components\TextInput::make('title')->required()->maxLength(200),
            Forms\Components\Textarea::make('summary')->rows(3)->required()
                ->helperText('In our own words. Facts from the source, not its text.'),
            Forms\Components\Select::make('applies_to')
                ->options(fn () => ['all' => 'Everyone'] + Gw2Product::query()->orderBy('sort_order')->pluck('name', 'key')->all())
                ->required(),
            Forms\Components\Select::make('category')->options([
                'expansion' => 'Expansion',
                'system' => 'System',
                'economy' => 'Economy',
                'raids_fractals' => 'Raids & fractals',
                'wvw_pvp' => 'WvW & PvP',
                'cosmetics' => 'Cosmetics',
                'business' => 'Business',
            ])->required(),
            Forms\Components\TextInput::make('source_url')->url()->required()->maxLength(500),
            Forms\Components\TextInput::make('source_label')->required()->maxLength(200),
            Forms\Components\Toggle::make('is_published')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('happened_on')->date()->sortable(),
                Tables\Columns\TextColumn::make('title')->searchable()->limit(60)->wrap(),
                Tables\Columns\TextColumn::make('applies_to')->badge(),
                Tables\Columns\IconColumn::make('is_published')->boolean(),
            ])
            ->defaultSort('happened_on', 'desc')
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Changes::route('/'),
            'create' => Pages\CreateGw2Change::route('/create'),
            'edit' => Pages\EditGw2Change::route('/{record}/edit'),
        ];
    }
}
