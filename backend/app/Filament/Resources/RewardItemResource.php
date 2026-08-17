<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RewardItemResource\Pages;
use App\Models\RewardItem;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class RewardItemResource extends Resource
{
    protected static ?string $model = RewardItem::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationLabel = 'Rewards Store';

    public static function getNavigationGroup(): ?string
    {
        return 'Gamification';
    }

    protected static ?int $navigationSort = 50;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, Set $set) => $set('slug', Str::slug($state))),
                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
                Forms\Components\Textarea::make('description')
                    ->maxLength(1000)
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('cost')
                    ->numeric()->minValue(0)->default(100)->required()->suffix('bounty'),
                Forms\Components\Select::make('type')
                    ->options(array_combine(RewardItem::TYPES, array_map('ucfirst', RewardItem::TYPES)))
                    ->default('perk')
                    ->required(),
                Forms\Components\TextInput::make('image')
                    ->label('Image URL')
                    ->maxLength(500),
                Forms\Components\TextInput::make('stock')
                    ->numeric()->minValue(0)
                    ->helperText('Leave empty for unlimited stock'),
                Forms\Components\TextInput::make('sort_order')
                    ->numeric()->default(0),
                Forms\Components\Toggle::make('is_active')->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('type')->badge()->sortable(),
                Tables\Columns\TextColumn::make('cost')->numeric()->sortable()->suffix(' ⛁'),
                Tables\Columns\TextColumn::make('stock')->placeholder('∞')->sortable(),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('sort_order')->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options(array_combine(RewardItem::TYPES, array_map('ucfirst', RewardItem::TYPES))),
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
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRewardItems::route('/'),
            'create' => Pages\CreateRewardItem::route('/create'),
            'edit' => Pages\EditRewardItem::route('/{record}/edit'),
        ];
    }
}
