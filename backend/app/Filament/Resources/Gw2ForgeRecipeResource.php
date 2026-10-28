<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2ForgeRecipeResource\Pages;
use App\Models\Gw2ForgeRecipe;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\DB;

/**
 * Mystic Forge recipes — the part of every legendary the API leaves out.
 *
 * A recipe reaches the planner only with a source and a "last checked" date.
 * Leave either empty and it is a draft: stored, visible here, used nowhere.
 * That is the whole safety of this table — a wrong ingredient is found at the
 * forge, after a month of play, and nothing else in the tool can cost a player
 * that much.
 *
 * Most rows are the gw2efficiency dataset (`ForgeDataset`), dated by its
 * commit rather than a check. Those are replaced as a whole when the dataset
 * is, so a correction to one should change its source and label too.
 */
class Gw2ForgeRecipeResource extends Resource
{
    protected static ?string $model = Gw2ForgeRecipe::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'GW2 Mystic Forge Recipes';

    protected static ?int $navigationSort = 45;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('output_item_id')
                ->label('Makes item id')
                ->numeric()
                ->required()
                ->helperText(fn ($state) => $state ? (DB::table('gw2_items')->where('id', $state)->value('name') ?? 'Not in the catalogue') : 'The id from the API, e.g. 30684 for Frostfang.'),

            Forms\Components\TextInput::make('output_count')
                ->numeric()
                ->default(1)
                ->required()
                ->helperText('Usually 1. For a random result, the average per attempt — e.g. 0.31 for a Mystic Clover.'),

            Forms\Components\Repeater::make('ingredients')
                ->schema([
                    Forms\Components\Select::make('type')->options(['Item' => 'Item', 'Currency' => 'Currency'])->default('Item')->required(),
                    Forms\Components\TextInput::make('id')->numeric()->required(),
                    Forms\Components\TextInput::make('count')->numeric()->default(1)->required(),
                ])
                ->columns(3)
                ->minItems(1)
                ->maxItems(4)
                ->required(),

            Forms\Components\TextInput::make('source_url')->url()->maxLength(500)
                ->helperText('Where this recipe was read. Without a source the planner does not use it.'),
            Forms\Components\TextInput::make('source_label')->maxLength(200),

            Forms\Components\DateTimePicker::make('checked_at')
                ->label('Last checked')
                ->helperText('When somebody confirmed it — in game, or against the source. Without it the planner does not use it.'),

            Forms\Components\Textarea::make('notes')->rows(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('output_item_id')
                    ->label('Makes')
                    ->formatStateUsing(fn ($state) => (DB::table('gw2_items')->where('id', $state)->value('name') ?? '?')." ({$state})")
                    ->searchable(),
                Tables\Columns\TextColumn::make('output_count')->label('Yield'),
                Tables\Columns\TextColumn::make('source_label')->limit(40)->placeholder('no source'),
                Tables\Columns\TextColumn::make('checked_at')->dateTime()->placeholder('draft — not used')->sortable(),
            ])
            ->defaultSort('checked_at', 'asc')
            ->filters([
                Tables\Filters\TernaryFilter::make('checked_at')->label('Checked')->nullable(),
                Tables\Filters\SelectFilter::make('source_label')
                    ->label('Source')
                    ->options(fn () => DB::table('gw2_forge_recipes')->whereNotNull('source_label')->distinct()->orderBy('source_label')->pluck('source_label', 'source_label')->all()),
            ])
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2ForgeRecipes::route('/'),
            'create' => Pages\CreateGw2ForgeRecipe::route('/create'),
            'edit' => Pages\EditGw2ForgeRecipe::route('/{record}/edit'),
        ];
    }
}
