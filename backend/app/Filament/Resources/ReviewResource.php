<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\NewsResource\RelationManagers\ContentVersionsRelationManager;
use App\Filament\Resources\ReviewResource\Pages;
use App\Models\Article;
use App\Models\Game;
// Layout Components (from Schemas)
use App\Policies\ArticlePolicy;
use App\Services\CacheService;
use App\Services\RawgService;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
// Form Field Components (from Forms)
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ReviewResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-star';

    protected static ?string $modelPolicy = ArticlePolicy::class;

    protected static ?string $slug = 'review-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 2;

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
                    ->schema([
                        // TITLE SECTION
                        Section::make()
                            ->schema([
                                TextInput::make('title')
                                    ->label('Review Title')
                                    ->placeholder('Write a compelling review title...')
                                    ->required()
                                    ->maxLength(100)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state)))
                                    ->helperText(
                                        fn ($state) => $state
                                        ? (strlen($state).'/100 chars'.(strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
                                        : 'Aim for 50-60 characters for optimal SEO'
                                    ),

                                Grid::make(2)->schema([
                                    TextInput::make('slug')
                                        ->label('Permalink')
                                        ->prefix('techplay.gg/reviews/')
                                        ->placeholder('auto-generated-slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->helperText('URL-friendly • Auto-generated from title'),

                                    Textarea::make('excerpt')
                                        ->label('Excerpt')
                                        ->placeholder('Brief summary for cards and social sharing...')
                                        ->rows(2)
                                        ->maxLength(200)
                                        ->helperText(
                                            fn ($state) => $state
                                            ? strlen($state).'/200 chars'
                                            : 'Short description shown in previews'
                                        ),
                                ]),
                            ])
                            ->compact(),

                        // CONTENT EDITOR
                        Section::make('Review Content')
                            ->icon('heroicon-o-document-text')
                            ->description('Write your in-depth review. Share your thoughts, experiences, and analysis.')
                            ->schema([
                                RichEditor::make('content')
                                    ->label('')
                                    ->placeholder('Start writing your review...')
                                    ->required()
                                    ->toolbarButtons([
                                        'attachFiles',
                                        'blockquote',
                                        'bold',
                                        'bulletList',
                                        'codeBlock',
                                        'h2',
                                        'h3',
                                        'italic',
                                        'link',
                                        'orderedList',
                                        'redo',
                                        'strike',
                                        'table',
                                        'underline',
                                        'undo',
                                        'alignStart',
                                        'alignCenter',
                                        'alignEnd',
                                        'alignJustify',
                                    ])
                                    ->fileAttachmentsDisk('public')
                                    ->fileAttachmentsDirectory('articles/content'),
                            ]),

                        // GAME DETAILS - Collapsible
                        Section::make('Game / Product Details')
                            ->icon('heroicon-o-puzzle-piece')
                            ->description('Information about the game being reviewed')
                            ->collapsed(false) // Uncollapsed to show validation errors
                            ->collapsible()
                            ->schema([
                                Select::make('rawg_game_slug')
                                    ->label('🔍 Auto-fill from RAWG.io')
                                    ->placeholder('Type a game name to search...')
                                    ->searchable()
                                    ->getSearchResultsUsing(function (string $search) {
                                        $service = new RawgService;
                                        $results = $service->searchGames($search);
                                        if (! $results || ! isset($results['results'])) {
                                            return [];
                                        }

                                        return collect($results['results'])
                                            ->mapWithKeys(fn ($game) => [$game['slug'] => "{$game['name']} (".substr($game['released'] ?? 'N/A', 0, 4).')'])
                                            ->toArray();
                                    })
                                    ->getOptionLabelUsing(fn ($value) => $value)
                                    ->live()
                                    ->afterStateUpdated(function (?string $state, Set $set) {
                                        if (! $state) {
                                            return;
                                        }
                                        $service = new RawgService;
                                        $details = $service->getGameDetails($state);
                                        if (! $details) {
                                            Notification::make()->title('Failed to fetch data from RAWG')->danger()->send();

                                            return;
                                        }
                                        $set('review_data.game_title', $details['name']);
                                        $set('review_data.developer', $details['developers'][0]['name'] ?? null);
                                        $set('review_data.publisher', $details['publishers'][0]['name'] ?? null);
                                        $set('review_data.release_date', $details['released'] ?? null);
                                        if (isset($details['parent_platforms'])) {
                                            $set('review_data.platforms', collect($details['parent_platforms'])->pluck('platform.name')->toArray());
                                        }
                                        if (isset($details['genres'])) {
                                            $set('review_data.genres', collect($details['genres'])->pluck('name')->map(fn ($g) => strtolower($g))->toArray());
                                        }

                                        // Upsert local Game record so ArticleObserver can link the review
                                        $game = Game::firstOrCreate(
                                            ['slug' => $state],
                                            [
                                                'name'             => $details['name'],
                                                'released'         => $details['released'] ?? null,
                                                'background_image' => $details['background_image'] ?? null,
                                                'rating'           => $details['rating'] ?? 0,
                                                'details_crawled_at' => now(),
                                            ]
                                        );
                                        $set('game_id', $game->id);

                                        Notification::make()->title('Fields filled from RAWG')->success()->send();
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
                                    ->label('🏆 FINAL SCORE')
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
                                        ->label('✅ The Good')
                                        ->simple(TextInput::make('item')->placeholder('Add positive point...'))
                                        ->defaultItems(3)
                                        ->addActionLabel('Add Pro'),
                                    Repeater::make('review_data.cons')
                                        ->label('❌ The Bad')
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
                                        'must_play' => '🏆 Must Play',
                                        'recommended' => '👍 Recommended',
                                        'wait_sale' => '⏳ Wait for Sale',
                                        'skip' => '👎 Skip It',
                                        'none' => 'No Verdict',
                                    ])
                                    ->default('none')
                                    ->native(false),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]), // Explicit Span

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('ReviewMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                Tab::make('Publish')
                                    ->icon('heroicon-o-paper-airplane')
                                    ->schema([
                                        Select::make('status')
                                            ->label('Status')
                                            ->options([
                                                'draft' => '📝 Draft',
                                                'ready_for_review' => '👁️ Pending Review',
                                                'scheduled' => '🕐 Scheduled',
                                                'published' => '🌐 Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->native(false)
                                            ->helperText('Use "Scheduled" to auto-publish on the Publish Date'),

                                        DateTimePicker::make('published_at')
                                            ->label('Publish Date')
                                            ->native(false)
                                            ->displayFormat('M j, Y • g:i A')
                                            ->default(now())
                                            ->helperText('When should this review go live?'),

                                        Select::make('category_id')
                                            ->label('Category')
                                            ->relationship('category', 'name', function (Builder $query) {
                                                return $query->where('type', 'reviews')
                                                    ->whereNotNull('parent_id');
                                            })
                                            ->searchable()
                                            ->preload()
                                            ->required()
                                            ->native(false),

                                        TagsInput::make('tags')
                                            ->label('Tags')
                                            ->placeholder('Add tag...')
                                            ->helperText('Press Enter after each tag'),

                                        Toggle::make('is_featured_in_hero')
                                            ->label('🌟 Feature in Homepage Hero')
                                            ->helperText('Highlight this review at the top of homepage'),

                                        Select::make('author_id')
                                            ->label('Author')
                                            ->options(fn () => CacheService::getAuthors())
                                            ->searchable()
                                            ->default(fn () => auth()->id())
                                            ->required()
                                            ->native(false),
                                    ]),

                                // TAB: SEO with Live Checker
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema(SeoFields::make('techplay.gg/reviews/', false)),

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
        return $table
            ->columns([
                ImageColumn::make('featured_image_url')
                    ->label('')
                    ->circular()
                    ->size(40),
                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->title),
                TextColumn::make('review_score')
                    ->label('Score')
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 8 => 'success',
                        $state >= 6 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn ($state) => $state ? $state.'/10' : '-'),
                TextColumn::make('category.name')
                    ->label('Category')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                IconColumn::make('is_featured_in_hero')
                    ->boolean()
                    ->label('🌟')
                    ->trueIcon('heroicon-s-star')
                    ->falseIcon('heroicon-o-star'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'ready_for_review' => 'warning',
                        'scheduled' => 'info',
                        'published' => 'success',
                        default => 'gray',
                    }),
                TextColumn::make('published_at')
                    ->label('Published')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('published_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'ready_for_review' => 'Pending Review',
                        'scheduled' => 'Scheduled',
                        'published' => 'Published',
                    ]),
                SelectFilter::make('category')
                    ->relationship('category', 'name', fn (Builder $query) => $query->where('type', 'reviews')),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
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
