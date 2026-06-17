<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CustomizationResource\Pages;
use App\Models\Customization;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class CustomizationResource extends Resource
{
    protected static ?string $model = Customization::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'Customizations';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, Forms\Set $set) => $set('slug', Str::slug($state))),
                Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true)->maxLength(255),
                Forms\Components\Select::make('type')
                    ->options(array_combine(Customization::TYPES, array_map('ucfirst', Customization::TYPES)))
                    ->default('frame')->required(),
                Forms\Components\Textarea::make('description')->maxLength(500)->columnSpanFull(),
                Forms\Components\TextInput::make('cost')->numeric()->minValue(0)->default(0)->suffix('bounty')
                    ->helperText('0 + a required tier = tier-exclusive (free to that tier).'),
                Forms\Components\TextInput::make('required_tier')->maxLength(60)
                    ->helperText('Support tier name required (leave empty for none).'),
                Forms\Components\TextInput::make('value')->maxLength(255)
                    ->helperText('Theme: accent hex (#FC4100). Frame/Badge: hex or CSS gradient.'),
                Forms\Components\TextInput::make('asset')->label('Asset URL')->maxLength(500),
                Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
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
                Tables\Columns\TextColumn::make('required_tier')->placeholder('—'),
                Tables\Columns\TextColumn::make('value')->toggleable(),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options(array_combine(Customization::TYPES, array_map('ucfirst', Customization::TYPES))),
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
            'index' => Pages\ListCustomizations::route('/'),
            'create' => Pages\CreateCustomization::route('/create'),
            'edit' => Pages\EditCustomization::route('/{record}/edit'),
        ];
    }
}
