<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GameResource\Pages;
use App\Models\Game;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
// Grid is imported for the same reason Group and Section are: without it, PHP
// resolves `Grid::make()` against the current namespace and looks for
// App\Filament\Resources\Grid. That is what broke the create form for a
// catalogue of 142,110 games — the page answered 500 and nobody could add one.
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Enums\PaginationMode;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;

class GameResource extends Resource
{
    /**
     * Findable from the top bar.
     *
     * The search box was wired to four resources, none of them the ones
     * anybody looks for. A hit is titled by `$recordTitleAttribute` and
     * matched against the columns below.
     */
    protected static ?string $recordTitleAttribute = 'name';

    /**
     * Five hits, not fifty.
     *
     * Filament's default is 50 per resource, and with 142,110 games in the
     * catalogue any common word floods the panel: searching "adi" returned
     * fifty games and buried the two users it was actually looking for. The
     * point of a global search is to show a spread across types and let you
     * pick a lane — for more of one kind, that resource's own list is one
     * click away and has filters.
     */
    protected static int $globalSearchResultsLimit = 5;

    /** @return list<string> */
    public static function getGloballySearchableAttributes(): array
    {
        return ['name', 'slug'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Released' => $record->released?->format('Y')]);
    }

    protected static ?string $model = Game::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static ?string $slug = 'games-database';

    protected static ?int $navigationSort = 10;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function getNavigationLabel(): string
    {
        return 'Games';
    }

    public static function getModelLabel(): string
    {
        return 'Game';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3])
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT — MAIN CONTENT (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Section::make()
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->label('Game Title')
                                    ->required()
                                    ->maxLength(500)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),

                                Forms\Components\TextInput::make('slug')
                                    ->label('Slug')
                                    ->prefix('techplay.gg/games/')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                            ])
                            ->compact(),

                        Section::make('Description')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\Textarea::make('description')
                                    ->label('')
                                    ->placeholder('Write a description for this game...')
                                    ->rows(8)
                                    ->helperText('This is the main game description shown on the game page.'),
                            ]),

                        Section::make('Cover Image')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                Forms\Components\TextInput::make('cover_url')
                                    ->label('Image URL')
                                    ->placeholder('https://...')
                                    ->url()
                                    ->helperText('Paste direct image URL (JPG/PNG)'),

                                Forms\Components\Placeholder::make('cover_preview')
                                    ->label('Preview')
                                    ->content(fn ($get) => new HtmlString(
                                        $get('cover_url')
                                            ? '<img src="'.e($get('cover_url')).'" style="max-height:200px;border-radius:6px;object-fit:cover;" />'
                                            : '<span style="color:#6b7280">No image set</span>'
                                    )),
                            ]),

                        Section::make('Screenshots')
                            ->icon('heroicon-o-camera')
                            ->collapsed()
                            ->schema([
                                Forms\Components\Repeater::make('screenshots')
                                    ->label('')
                                    ->simple(
                                        Forms\Components\TextInput::make('url')
                                            ->label('Screenshot URL')
                                            ->url()
                                            ->placeholder('https://...')
                                            ->required(),
                                    )
                                    ->addActionLabel('Add Screenshot')
                                    ->defaultItems(0)
                                    ->reorderable()
                                    ->helperText('Direct image URLs, in display order'),
                            ]),

                        Section::make('Trailers & Videos')
                            ->icon('heroicon-o-film')
                            ->collapsed()
                            ->schema([
                                Forms\Components\Repeater::make('videos')
                                    ->label('')
                                    ->simple(
                                        Forms\Components\TextInput::make('url')
                                            ->label('Video URL')
                                            ->url()
                                            ->placeholder('https://... (YouTube or direct mp4)')
                                            ->required(),
                                    )
                                    ->addActionLabel('Add Video')
                                    ->defaultItems(0)
                                    ->reorderable()
                                    ->helperText('The first video is the lead trailer'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT — SIDEBAR (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Section::make('Details')
                            ->icon('heroicon-o-information-circle')
                            ->schema([
                                Forms\Components\DatePicker::make('released')
                                    ->label('Release Date')
                                    ->native(false)
                                    ->displayFormat('M j, Y'),

                                Forms\Components\TextInput::make('rating')
                                    ->label('Rating')
                                    ->numeric()
                                    ->minValue(0)
                                    ->maxValue(5)
                                    ->step(0.01)
                                    ->placeholder('0.00')
                                    ->suffix('/ 5'),

                                Forms\Components\TextInput::make('website')
                                    ->label('Official Website')
                                    ->url()
                                    ->placeholder('https://...'),
                            ]),

                        Section::make('Critic Scores')
                            ->icon('heroicon-o-star')
                            ->description('Filled by enrichment where sources exist; hand-entered otherwise. TechPlay score is computed from our reviews and is not edited here.')
                            ->schema([
                                Grid::make(2)->schema([
                                    Forms\Components\TextInput::make('critic_scores.opencritic.score')
                                        ->label('OpenCritic')
                                        ->numeric()->minValue(0)->maxValue(100)->placeholder('—'),
                                    Forms\Components\TextInput::make('critic_scores.opencritic.url')
                                        ->label('OpenCritic URL')
                                        ->url()->placeholder('https://opencritic.com/game/...'),
                                ]),
                                Grid::make(2)->schema([
                                    Forms\Components\TextInput::make('critic_scores.metacritic.score')
                                        ->label('Metacritic')
                                        ->numeric()->minValue(0)->maxValue(100)->placeholder('—'),
                                    Forms\Components\TextInput::make('critic_scores.metacritic.url')
                                        ->label('Metacritic URL')
                                        ->url()->placeholder('https://www.metacritic.com/game/...'),
                                ]),
                            ]),

                        Section::make('Companies')
                            ->icon('heroicon-o-building-office')
                            ->schema([
                                Forms\Components\TagsInput::make('developers')
                                    ->label('Developers')
                                    ->placeholder('Add developer...'),

                                Forms\Components\TagsInput::make('publishers')
                                    ->label('Publishers')
                                    ->placeholder('Add publisher...'),
                            ]),

                        Section::make('Taxonomy')
                            ->icon('heroicon-o-tag')
                            ->schema([
                                Forms\Components\TagsInput::make('genres')
                                    ->label('Genres')
                                    ->placeholder('Add genre...')
                                    ->helperText('e.g. Action, RPG, Strategy'),

                                Forms\Components\TagsInput::make('platforms')
                                    ->label('Platforms')
                                    ->placeholder('Add platform...')
                                    ->helperText('e.g. PC, PlayStation 5, Xbox Series'),

                                Forms\Components\TagsInput::make('tags')
                                    ->label('Tags')
                                    ->placeholder('Add tag...')
                                    ->helperText('Additional keywords'),
                            ]),

                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    /**
     * The list reads eight columns; the table has forty and weighs 377 MB.
     *
     * `select *` on this catalogue pulled about 2.2 KB of payload per row that
     * nothing on screen used — screenshots (491 B average), box art (399),
     * description (386), attributes (319), videos (238) — and every one of
     * those is TOASTed, so fetching them costs a second lookup each. Measured
     * before this: 165 ms to read twenty-five rows.
     *
     * The two heavy ones are only ever asked a yes/no question — "does it have
     * a description", "does it have screenshots" — so the answer is computed in
     * SQL and the content never leaves the database.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->select([
            'id',
            'name',
            'slug',
            'cover_url',
            'rating',
            'released',
            'views',
            'platforms',
            'genres',
            // No empty-string descriptions exist (checked: 0 of 142,110), so IS NOT
            // NULL is enough — and unlike a comparison it never has to detoast the
            // column to answer.
            DB::raw('(description IS NOT NULL) AS has_description'),
            DB::raw("(screenshots IS NOT NULL AND screenshots::text NOT IN ('[]', 'null', '')) AS has_screenshots"),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            /*
             * Simple pagination: previous and next, no page numbers.
             *
             * The numbered pager has to ask `select count(*) from games` on
             * every load, and on 142,110 rows Postgres answers that with a
             * sequential scan — 83 ms measured, on a screen whose own render is
             * 130. Nobody pages to 5,684 anyway; the catalogue is reached by
             * searching and filtering.
             */
            ->paginationMode(PaginationMode::Simple)
            /*
             * Selection stops at the page you are looking at.
             *
             * Filament's "select all" needs a total, and asking `count(*)` of
             * 142,110 rows costs 52 ms on every single load of this screen —
             * a quarter of its render time, spent so a checkbox can offer to
             * select a hundred and forty-two thousand games at once. That is
             * not an operation anyone should reach for from a list, and the
             * bulk action underneath it is Delete.
             */
            ->selectCurrentPageOnly()
            ->columns([
                ImageColumn::make('cover_url')
                    ->label('')
                    ->width(60)
                    ->height(40)
                    ->defaultImageUrl('/images/placeholder-game.png'),

                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->limit(45)
                    ->tooltip(fn ($record) => $record->name),

                TextColumn::make('rating')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 4.0 => 'success',
                        $state >= 2.5 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn ($state) => $state ? number_format($state, 2) : '—'),

                TextColumn::make('released')
                    ->label('Released')
                    ->date('Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('platforms')
                    ->label('Platforms')
                    ->badge()
                    ->color('info')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(),

                TextColumn::make('genres')
                    ->label('Genres')
                    ->badge()
                    ->color('gray')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(isToggledHiddenByDefault: true),

                IconColumn::make('description')
                    ->label('Desc')
                    ->state(fn ($record) => (bool) $record->has_description)
                    ->boolean()
                    ->trueIcon('heroicon-s-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                IconColumn::make('screenshots')
                    ->label('Screenshots')
                    ->state(fn ($record) => (bool) $record->has_screenshots)
                    ->boolean()
                    ->trueIcon('heroicon-s-photo')
                    ->falseIcon('heroicon-o-photo')
                    ->trueColor('success')
                    ->falseColor('gray'),
            ])
            /*
             * Newest first, not highest rated.
             *
             * `defaultSort('rating', 'desc')` looked sensible and was the
             * slowest thing in the panel. 114,301 of the 142,110 games have no
             * rating at all, and Postgres sorts NULLs first on a DESC — so the
             * screen opened with a hundred and fourteen thousand unrated rows,
             * and the planner had to walk every one of them before it could
             * order the first 25 by id. Measured: 38,076 buffers read, 229 ms.
             *
             * `id` descending is the aggregator's arrival order, uses the
             * primary key, and reads twenty-five rows.
             */
            ->defaultSort('id', 'desc')
            ->filters([
                TernaryFilter::make('description')
                    ->label('Description')
                    ->queries(
                        true: fn (Builder $q) => $q->whereNotNull('description'),
                        false: fn (Builder $q) => $q->whereNull('description'),
                    )
                    ->trueLabel('Has description')
                    ->falseLabel('Needs description')
                    ->placeholder('All games'),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                Action::make('onSite')
                    ->label('View on site')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->url(fn ($record): string => config('app.site_url').'/games/'.$record->slug, shouldOpenInNewTab: true)
                    ->visible(fn ($record): bool => filled($record->slug)),
                EditAction::make(),
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
            'index' => Pages\ListGames::route('/'),
            'create' => Pages\CreateGame::route('/create'),
            'edit' => Pages\EditGame::route('/{record}/edit'),
        ];
    }
}
