<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2GuideResource\Pages;
use App\Models\Gw2Guide;
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
 * Writing the public Guild Wars 2 guides.
 *
 * §20 of the working document is blunt about why these matter more than the
 * dashboard: *"The strongest acquisition model is public, indexable guide pages
 * that become personalized after account connection. Private dashboards
 * themselves do not rank."*
 *
 * Three things this screen is trying to make easy to get right:
 *
 * **Write for somebody with no account.** §20.2 requires it, and a page that is
 * empty without a key cannot rank. The personalisation is an addition to prose
 * that already stands on its own.
 *
 * **Say where it came from.** Same contract as the rules: owner, sources,
 * reviewed date, game build. §25 lists provenance as the first control on a
 * wrong claim in front of an audience that knows the game better than we do.
 *
 * **Pick the personalisation from a list.** A guide naming a key nothing
 * resolves renders as though it had none — the right failure, and not one worth
 * inviting through a free-text field.
 */
class Gw2GuideResource extends Resource
{
    protected static ?string $model = Gw2Guide::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $navigationLabel = 'GW2 Guides';

    protected static ?int $navigationSort = 39;

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\Select::make('family')
                ->options(Gw2Guide::FAMILIES)
                ->required()
                ->helperText('The URL family. These are the nine §20.1 names — a tenth would be a page nothing links to.'),

            Forms\Components\TextInput::make('slug')
                ->required()
                ->maxLength(120)
                ->helperText('Unique within the family. /gw2/{family}/{slug}'),

            Forms\Components\TextInput::make('title')->required()->maxLength(180),

            Forms\Components\Textarea::make('standfirst')
                ->rows(2)
                ->maxLength(300)
                ->helperText('The sentence under the title. Also the meta description and the card text when those are empty.'),

            Forms\Components\RichEditor::make('body')
                ->columnSpanFull()
                ->helperText('Write it for somebody with no account connected. Everything below is an addition to this, never a replacement for it.'),

            Forms\Components\Select::make('personalise_as')
                ->options(Gw2Guide::PERSONALISATIONS)
                ->placeholder('Nothing — purely editorial')
                ->helperText('What a signed-in reader sees inlined. Leaving it empty is a legitimate answer: not every page has a number to show.'),

            Forms\Components\KeyValue::make('next_steps')
                ->keyLabel('Label')
                ->valueLabel('Link')
                ->helperText('Where a reader goes next. Internal paths work; this is how the family becomes a graph rather than a set of orphans.'),

            Forms\Components\TextInput::make('seo_title')->maxLength(200),
            Forms\Components\Textarea::make('seo_description')->rows(2)->maxLength(320),
            Forms\Components\TagsInput::make('keywords'),
            Forms\Components\TextInput::make('hero_image')->maxLength(500),

            Forms\Components\TextInput::make('owner')
                ->maxLength(60)
                ->helperText('Who answers for this page when a reader says it is wrong.'),

            Forms\Components\Select::make('source_ids')
                ->label('Sources')
                ->multiple()
                ->options(fn () => Gw2Source::query()->orderBy('label')->pluck('label', 'id')->all()),

            Forms\Components\TextInput::make('game_build')
                ->numeric()
                ->helperText('The build this was last checked against. A fractal threshold or an acquisition route can go wrong without anybody touching the page.'),

            Forms\Components\DateTimePicker::make('reviewed_at')->label('Last reviewed'),

            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),

            Forms\Components\Toggle::make('is_published')
                ->helperText('Unpublished pages are invisible to readers and absent from the sitemap.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('family')->badge()->sortable(),
                Tables\Columns\TextColumn::make('title')->searchable()->limit(46)->wrap(),
                Tables\Columns\TextColumn::make('personalise_as')
                    ->label('Personalised')
                    ->badge()
                    ->placeholder('editorial only'),
                Tables\Columns\IconColumn::make('is_published')->boolean(),
                Tables\Columns\TextColumn::make('reviewed_at')->dateTime()->placeholder('never')->sortable(),
                Tables\Columns\TextColumn::make('views')->sortable()->toggleable(),
            ])
            ->defaultSort('family')
            ->filters([
                Tables\Filters\SelectFilter::make('family')->options(Gw2Guide::FAMILIES),
                Tables\Filters\TernaryFilter::make('is_published')->label('Published'),
                Tables\Filters\TernaryFilter::make('reviewed_at')->label('Reviewed')->nullable(),
            ])
            ->actions([EditAction::make(), DeleteAction::make()])
            ->bulkActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGw2Guides::route('/'),
            'create' => Pages\CreateGw2Guide::route('/create'),
            'edit' => Pages\EditGw2Guide::route('/{record}/edit'),
        ];
    }
}
