<?php

namespace App\Filament\Resources;

use App\Filament\Components\ArticleEditorFields;
use App\Filament\Components\ArticleTable;
use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\NewsResource\RelationManagers\ContentVersionsRelationManager;
use App\Filament\Resources\ReviewResource\Pages;
use App\Models\Article;
use App\Models\Game;
// Layout Components (from Schemas)
use App\Policies\ArticlePolicy;
// Form Field Components (from Forms)
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ReviewResource extends Resource
{
    /**
     * Findable from the top bar.
     *
     * The search box was wired to four resources, none of them the ones
     * anybody looks for. A hit is titled by `$recordTitleAttribute` and
     * matched against the columns below.
     */
    protected static ?string $recordTitleAttribute = 'title';

    /**
     * Five hits, not fifty.
     *
     * Filament's default is 50 per resource, and with 332,455 games in the
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
        return ['title', 'slug', 'excerpt'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Status' => $record->status]);
    }

    protected static ?string $model = Article::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-star';

    protected static ?string $modelPolicy = ArticlePolicy::class;

    protected static ?string $slug = 'review-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 30;

    public static function getNavigationLabel(): string
    {
        return 'Reviews';
    }

    public static function getModelLabel(): string
    {
        return 'Review';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['author', 'category'])
            ->whereHas('category', function ($query) {
                $query->where('type', 'reviews');
            });
    }

    public static function form(Schema $schema): Schema
    {
        $calculateScore = function ($get, $set) {
            $gameplay = (float) $get('review_data.ratings.gameplay');
            $visuals = (float) $get('review_data.ratings.visuals');
            $audio = (float) $get('review_data.ratings.audio');
            $narrative = (float) $get('review_data.ratings.narrative');
            $replayability = (float) $get('review_data.ratings.replayability');

            $average = ($gameplay + $visuals + $audio + $narrative + $replayability) / 5;
            $set('review_score', number_format($average, 1));

            // Auto-set recommendation based on TechPlay rating system
            $recommendation = match (true) {
                $average >= 9.5 => 'must_play',     // 10 = Masterpiece
                $average >= 8.5 => 'must_play',     // 9 = Amazing - Must Play
                $average >= 7.5 => 'recommended',   // 8 = Great - Recommended
                $average >= 6.5 => 'recommended',   // 7 = Good - Recommended
                $average >= 4.5 => 'wait_sale',     // 5-6 = Average - Wait for Sale
                $average > 0 => 'skip',             // 1-4 = Poor/Broken - Skip
                default => 'none',
            };
            $set('review_data.cta', $recommendation);
        };

        return $schema
            ->columns(['default' => 1, 'lg' => 3]) // Explicit Grid Definition
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT COLUMN - MAIN CONTENT AREA (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema(array_merge(ArticleEditorFields::make('techplay.gg/reviews/', 'review'), [
                        // GAME DETAILS - Collapsible
                        Section::make('Game / Product Details')
                            ->icon('heroicon-o-puzzle-piece')
                            ->description('Information about the game being reviewed')
                            ->collapsed(false) // Uncollapsed to show validation errors
                            ->collapsible()
                            ->schema([
                                Select::make('catalogue_game_search')
                                    ->label('Auto-fill from the games database')
                                    ->placeholder('Type a game name to search...')
                                    ->searchable()
                                    ->getSearchResultsUsing(function (string $search) {
                                        // Our own 200k catalogue, via the trgm index.
                                        return Game::query()
                                            ->where('name', 'ilike', "%{$search}%")
                                            ->orderByDesc('rating')
                                            ->limit(20)
                                            ->get(['slug', 'name', 'released'])
                                            ->mapWithKeys(fn ($g) => [$g->slug => "{$g->name} (".($g->released?->format('Y') ?? 'N/A').')'])
                                            ->toArray();
                                    })
                                    ->getOptionLabelUsing(fn ($value) => $value)
                                    ->live()
                                    ->afterStateUpdated(function (?string $state, Set $set) {
                                        if (! $state) {
                                            return;
                                        }
                                        $game = Game::where('slug', $state)->first();
                                        if (! $game) {
                                            Notification::make()->title('Game not found in the catalogue')->danger()->send();

                                            return;
                                        }
                                        $set('review_data.game_title', $game->name);
                                        $set('review_data.developer', ($game->developers ?? [])[0] ?? null);
                                        $set('review_data.publisher', ($game->publishers ?? [])[0] ?? null);
                                        $set('review_data.release_date', $game->released?->toDateString());
                                        $set('review_data.platforms', array_slice((array) $game->platforms, 0, 6));
                                        $set('review_data.genres', array_map('strtolower', array_slice((array) $game->genres, 0, 4)));

                                        $set('game_id', $game->id);

                                        Notification::make()->title('Fields filled from the games database')->success()->send();
                                    })
                                    ->dehydrated(false)
                                    ->helperText('Select a game to auto-fill title, developer, publisher, release date, platforms and genres'),

                                Hidden::make('game_id'),

                                Grid::make(2)->schema([
                                    TextInput::make('review_data.game_title')
                                        ->label('Game Title')
                                        ->placeholder('e.g. The Legend of Zelda'),
                                    TextInput::make('review_data.developer')
                                        ->label('Developer')
                                        ->placeholder('e.g. Nintendo'),
                                    TextInput::make('review_data.publisher')
                                        ->label('Publisher')
                                        ->placeholder('e.g. Nintendo'),
                                    DateTimePicker::make('review_data.release_date')
                                        ->label('Release Date'),
                                ]),
                                Grid::make(2)->schema([
                                    TagsInput::make('review_data.platforms')
                                        ->label('Platforms')
                                        ->placeholder('Add platform...')
                                        ->suggestions(['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile']),
                                    Select::make('review_data.genres')
                                        ->label('Genres')
                                        ->placeholder('Search genres...')
                                        ->multiple()
                                        ->searchable()
                                        ->options([
                                            // Core Genres
                                            'Action' => 'Action',
                                            'Adventure' => 'Adventure',
                                            'RPG' => 'RPG',
                                            'Shooter' => 'Shooter',
                                            'Strategy' => 'Strategy',
                                            'Simulation' => 'Simulation',
                                            'Puzzle' => 'Puzzle',
                                            'Platformer' => 'Platformer',
                                            'Horror' => 'Horror',
                                            'Sports' => 'Sports',
                                            'Racing' => 'Racing',
                                            'Fighting' => 'Fighting',
                                            // RPG Subtypes
                                            'JRPG' => 'JRPG',
                                            'ARPG' => 'ARPG',
                                            'MMORPG' => 'MMORPG',
                                            // Shooter Subtypes
                                            'FPS' => 'FPS',
                                            'TPS' => 'TPS',
                                            'Battle Royale' => 'Battle Royale',
                                            // Strategy Subtypes
                                            'RTS' => 'RTS',
                                            'Turn-Based' => 'Turn-Based',
                                            '4X' => '4X',
                                            // Subgenres
                                            'Metroidvania' => 'Metroidvania',
                                            'Survival' => 'Survival',
                                            'Survival Horror' => 'Survival Horror',
                                            'Roguelike' => 'Roguelike',
                                            'Roguelite' => 'Roguelite',
                                            'Souls-like' => 'Souls-like',
                                            'Open World' => 'Open World',
                                            'Sandbox' => 'Sandbox',
                                            'Crafting' => 'Crafting',
                                            'Stealth' => 'Stealth',
                                            'Hack and Slash' => 'Hack and Slash',
                                            'Beat em Up' => 'Beat em Up',
                                            // Story Games
                                            'Visual Novel' => 'Visual Novel',
                                            'Point and Click' => 'Point and Click',
                                            'Interactive Story' => 'Interactive Story',
                                            // Casual/Social
                                            'Card Game' => 'Card Game',
                                            'Board Game' => 'Board Game',
                                            'Party Game' => 'Party Game',
                                            'Indie' => 'Indie',
                                            'Retro' => 'Retro',
                                            'Arcade' => 'Arcade',
                                            'Casual' => 'Casual',
                                            // Multiplayer
                                            'MMO' => 'MMO',
                                            'Co-op' => 'Co-op',
                                            'Multiplayer' => 'Multiplayer',
                                            'PvP' => 'PvP',
                                            'PvE' => 'PvE',
                                            // Management
                                            'City Builder' => 'City Builder',
                                            'Management' => 'Management',
                                            'Tycoon' => 'Tycoon',
                                            // Other
                                            'Rhythm' => 'Rhythm',
                                            'Music' => 'Music',
                                            'VR' => 'VR',
                                            'AR' => 'AR',
                                        ]),
                                ]),
                            ]),

                        // SCORE BOARD - Collapsible
                        Section::make('Score Board')
                            ->icon('heroicon-o-star')
                            ->description('Rate different aspects of the game')
                            ->collapsed()
                            ->collapsible()
                            ->schema([
                                TextInput::make('review_score')
                                    ->label('Final score')
                                    ->readOnly()
                                    ->dehydrated()
                                    ->numeric()
                                    ->suffix('/10')
                                    ->helperText('Auto-calculated from individual ratings'),

                                Grid::make(5)->schema([
                                    TextInput::make('review_data.ratings.gameplay')
                                        ->label('Gameplay')
                                        ->numeric()
                                        ->maxValue(10)
                                        ->placeholder('0')
                                        ->live()
                                        ->afterStateUpdated($calculateScore),
                                    TextInput::make('review_data.ratings.visuals')
                                        ->label('Visuals')
                                        ->numeric()
                                        ->maxValue(10)
                                        ->placeholder('0')
                                        ->live()
                                        ->afterStateUpdated($calculateScore),
                                    TextInput::make('review_data.ratings.audio')
                                        ->label('Audio')
                                        ->numeric()
                                        ->maxValue(10)
                                        ->placeholder('0')
                                        ->live()
                                        ->afterStateUpdated($calculateScore),
                                    TextInput::make('review_data.ratings.narrative')
                                        ->label('Narrative')
                                        ->numeric()
                                        ->maxValue(10)
                                        ->placeholder('0')
                                        ->live()
                                        ->afterStateUpdated($calculateScore),
                                    TextInput::make('review_data.ratings.replayability')
                                        ->label('Replay')
                                        ->numeric()
                                        ->maxValue(10)
                                        ->placeholder('0')
                                        ->live()
                                        ->afterStateUpdated($calculateScore),
                                ]),
                            ]),

                        // VERDICT - Collapsible
                        Section::make('Verdict')
                            ->icon('heroicon-o-scale')
                            ->collapsed()
                            ->collapsible()
                            ->schema([
                                Grid::make(2)->schema([
                                    Repeater::make('review_data.pros')
                                        ->label('The good')
                                        ->simple(TextInput::make('item')->placeholder('Add positive point...'))
                                        ->defaultItems(3)
                                        ->addActionLabel('Add Pro'),
                                    Repeater::make('review_data.cons')
                                        ->label('The bad')
                                        ->simple(TextInput::make('item')->placeholder('Add negative point...'))
                                        ->defaultItems(3)
                                        ->addActionLabel('Add Con'),
                                ]),
                                Textarea::make('review_data.conclusion')
                                    ->label('Final Verdict')
                                    ->placeholder('Sum up your thoughts in 2-3 sentences...')
                                    ->rows(3),

                                Select::make('review_data.cta')
                                    ->label('Recommendation')
                                    ->options([
                                        'must_play' => 'Must play',
                                        'recommended' => 'Recommended',
                                        'wait_sale' => 'Wait for a sale',
                                        'skip' => 'Skip it',
                                        'none' => 'No verdict',
                                    ])
                                    ->default('none')
                                    ->native(false),
                            ]),
                    ]))
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('ReviewMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                PublishTab::make('reviews', 'review'),

                                // TAB: SEO with Live Checker
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[0])
                                    ->badgeColor(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[1])
                                    // `reviews/[slug]` reads `canonical_url` and
                                    // always has; this screen was the only one of
                                    // the four that never let anyone set it.
                                    ->schema(SeoFields::make('techplay.gg/reviews/')),

                                // TAB: MEDIA with Library Picker
                                Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema(MediaPickerFields::make('featured_image_url', 'featured_image_alt', 'reviews')),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]), // Explicit Span
            ]);
    }

    public static function table(Table $table): Table
    {
        return ArticleTable::configure(
            $table,
            sitePath: 'reviews',
            categoryType: 'reviews',
            // The one column a review list has that the others do not, and the
            // only one here that every row fills in: 38 of 38 carry a score,
            // averaging 7.5.
            extraColumns: [
                TextColumn::make('review_score')
                    ->label('Score')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 8 => 'success',
                        $state >= 6 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn ($state) => filled($state) ? number_format((float) $state, 1) : '—'),
            ],
        );
    }

    public static function getRelations(): array
    {
        return [
            ContentVersionsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReviews::route('/'),
            'create' => Pages\CreateReview::route('/create'),
            'edit' => Pages\EditReview::route('/{record}/edit'),
        ];
    }
}
