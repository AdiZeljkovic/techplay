<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2GoalResource\Pages;
use App\Models\Gw2Goal;
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
 * What a player may say they are working towards.
 *
 * A goal picked here adds 35 to every rule that names it, which §8.2 makes the
 * largest single component of a recommendation's score. So adding a row is not
 * free: a goal with no rules behind it is a button that changes nothing, which
 * is exactly the failure this whole feature was built to fix — `?goal=` was
 * accepted and ignored for as long as the advisor existed.
 *
 * The rule to hold: add the goal when the rules that serve it exist, not before.
 */
class Gw2GoalResource extends Resource
{
    protected static ?string $model = Gw2Goal::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'GW2 Goals';

    protected static ?int $navigationSort = 43;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('slug')
                ->required()
                ->maxLength(48)
                ->unique(ignoreRecord: true)
                ->helperText('What a rule names to say it serves this goal, and what the URL carries.'),

            Forms\Components\TextInput::make('title')
                ->required()
                ->maxLength(120)
                ->helperText('In the player\'s words, not the system\'s. "Get further in fractals", not "Fractal progression".'),

            Forms\Components\Textarea::make('summary')
                ->rows(2)
                ->maxLength(200)
                ->helperText('What picking this changes. Shown on the picker, because a one-word label does not tell somebody whether it is the right choice for them.'),

            Forms\Components\TextInput::make('domain')->maxLength(24),
            Forms\Components\TextInput::make('icon')->maxLength(40),
            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),

            Forms\Components\Toggle::make('is_active')
                ->default(true)
                ->helperText('Turn a goal off rather than deleting it — the pins that reference it are somebody\'s choices.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('sort_order')->label('#')->sortable(),
                Tables\Columns\TextColumn::make('title')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('slug')->color('gray'),
                Tables\Columns\TextColumn::make('domain')->badge()->placeholder('—'),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
            ])
            ->defaultSort('sort_order')
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Goals::route('/'),
            'create' => Pages\CreateGw2Goal::route('/create'),
            'edit' => Pages\EditGw2Goal::route('/{record}/edit'),
        ];
    }
}
