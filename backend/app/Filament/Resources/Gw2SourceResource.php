<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2SourceResource\Pages;
use App\Models\Gw2Source;
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
 * Where the advisor's claims come from.
 *
 * §18.2 calls this the source registry and §25 lists provenance as the first
 * control on the product's largest risk: a wrong recommendation in front of an
 * audience that knows Guild Wars 2 better than we do. A rule that turns out
 * wrong should be traceable to what it was based on, and by whom.
 *
 * `checked_at` is the field that matters most and is easiest to leave empty. A
 * source is not a citation, it is something that can go stale — a wiki link
 * nobody has opened since the last balance patch is worse than no link at all,
 * because it looks like diligence.
 *
 * `measured` is a first-class kind here and arguably the strongest: most of
 * what this advisor claims was measured against the live API rather than read
 * anywhere, and a measurement is the only kind of source that can be re-run.
 */
class Gw2SourceResource extends Resource
{
    protected static ?string $model = Gw2Source::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $navigationLabel = 'GW2 Rule Sources';

    protected static ?int $navigationSort = 44;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('label')->required()->maxLength(120),

            Forms\Components\TextInput::make('url')
                ->required()
                ->maxLength(500)
                ->helperText('A URL, or an internal:// marker for something measured or decided here rather than read.'),

            Forms\Components\Select::make('kind')
                ->options(Gw2Source::KINDS)
                ->required()
                ->default('wiki'),

            Forms\Components\DateTimePicker::make('checked_at')
                ->label('Last checked')
                ->helperText('When somebody last opened it and agreed it still says what the rules claim. An unchecked source looks like diligence and is not.'),

            Forms\Components\Textarea::make('notes')->rows(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('label')->searchable()->limit(50)->wrap(),
                Tables\Columns\TextColumn::make('kind')->badge(),
                Tables\Columns\TextColumn::make('url')->limit(40)->color('gray')->url(fn (Gw2Source $r) => str_starts_with($r->url, 'http') ? $r->url : null, true),
                Tables\Columns\TextColumn::make('checked_at')
                    ->dateTime()
                    ->placeholder('never checked')
                    ->sortable(),
            ])
            ->defaultSort('checked_at', 'asc')
            ->filters([
                Tables\Filters\SelectFilter::make('kind')->options(Gw2Source::KINDS),
                Tables\Filters\TernaryFilter::make('checked_at')->label('Checked')->nullable(),
            ])
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Sources::route('/'),
            'create' => Pages\CreateGw2Source::route('/create'),
            'edit' => Pages\EditGw2Source::route('/{record}/edit'),
        ];
    }
}
