<?php

namespace App\Filament\Resources\Articles\Schemas;

use Filament\Schemas\Schema;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Group;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Tabs;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Split;
use Filament\Schemas\Components\Utilities\Set;
use Illuminate\Support\Str;
use Illuminate\Support\HtmlString;

class ArticleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT COLUMN - MAIN CONTENT AREA (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        // TITLE - Hero styled input
                        Section::make()
                            ->schema([
                                TextInput::make('title')
                                    ->label('Article Title')
                                    ->placeholder('Write a compelling headline that grabs attention...')
                                    ->required()
                                    ->maxLength(100)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state)))
                                    ->extraAttributes(['class' => 'text-xl font-bold'])
                                    ->helperText(
                                        fn($state) => $state
                                        ? (strlen($state) . '/100 characters' . (strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
                                        : 'Aim for 50-60 characters for optimal SEO'
                                    ),

                                Grid::make(2)->schema([
                                    TextInput::make('slug')
                                        ->label('Permalink')
                                        ->prefix('techplay.gg/news/')
                                        ->placeholder('auto-generated-slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->helperText('URL-friendly version • Auto-generated from title'),

                                    Textarea::make('excerpt')
                                        ->label('Excerpt')
                                        ->placeholder('Brief summary for article previews and social sharing...')
                                        ->rows(2)
                                        ->maxLength(200)
                                        ->helperText(
                                            fn($state) => $state
                                            ? strlen($state) . '/200 characters'
                                            : 'Short description shown in cards and social shares'
                                        ),
                                ]),
                            ])
                            ->compact(),

                        // CONTENT - Full Width Editor
                        Section::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->description('Use the editor to format your article with headings, images, and rich media.')
                            ->schema([
                                RichEditor::make('content')
                                    ->label('')
                                    ->placeholder('Start writing your story...')
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
                                        'underline',
                                        'undo',
                                    ])
                                    ->fileAttachmentsDisk('public')
                                    ->fileAttachmentsDirectory('article-content')
                                    ->columnSpanFull(),
                            ]),

                        // REVIEW SECTION - Collapsible
                        Section::make('Review Data')
                            ->icon('heroicon-o-star')
                            ->description('Game review details, ratings and verdict')
                            ->collapsed()
                            ->collapsible()
                            ->schema([
                                Toggle::make('is_review_article')
                                    ->label('This is a Game Review')
                                    ->live()
                                    ->dehydrated(false)
                                    ->afterStateHydrated(fn($component, $state) => $component->state((bool) ($component->getRecord()?->review_data)))
                                    ->helperText('Enable to show review fields: ratings, pros/cons, and game info'),

                                Group::make()
                                    ->schema([
                                        // Game Info Grid
                                        Grid::make(3)->schema([
                                            TextInput::make('review_data.game_title')
                                                ->label('Game Title')
                                                ->placeholder('e.g. The Legend of Zelda')
                                                ->required(),
                                            TextInput::make('review_data.developer')
                                                ->label('Developer')
                                                ->placeholder('e.g. Nintendo'),
                                            TextInput::make('review_data.publisher')
                                                ->label('Publisher')
                                                ->placeholder('e.g. Nintendo'),
                                        ]),

                                        Grid::make(4)->schema([
                                            DateTimePicker::make('review_data.release_date')
                                                ->label('Release Date'),
                                            TextInput::make('review_data.play_time')
                                                ->label('Play Time')
                                                ->placeholder('e.g. 40+ hours'),
                                            TextInput::make('review_data.tested_on')
                                                ->label('Tested On')
                                                ->placeholder('e.g. PS5, PC'),
                                            TextInput::make('review_data.price')
                                                ->label('Price')
                                                ->placeholder('e.g. $59.99'),
                                        ]),

                                        Grid::make(2)->schema([
                                            TagsInput::make('review_data.platforms')
                                                ->label('Platforms')
                                                ->placeholder('Add platform...')
                                                ->suggestions(['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Steam Deck']),
                                            TagsInput::make('review_data.genres')
                                                ->label('Genres')
                                                ->placeholder('Add genre...')
                                                ->suggestions(['Action', 'RPG', 'FPS', 'TPS', 'Indie', 'Adventure', 'Strategy', 'Simulation', 'Horror', 'Puzzle']),
                                        ]),

                                        // SCORE - Prominent
                                        Section::make('Score')
                                            ->schema([
                                                Grid::make(7)->schema([
                                                    TextInput::make('review_score')
                                                        ->label('FINAL SCORE')
                                                        ->numeric()
                                                        ->step(0.1)
                                                        ->minValue(0)
                                                        ->maxValue(10)
                                                        ->placeholder('0.0')
                                                        ->suffix('/10')
                                                        ->helperText('The main review score'),
                                                    TextInput::make('review_data.ratings.gameplay')
                                                        ->label('Gameplay')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                    TextInput::make('review_data.ratings.story')
                                                        ->label('Story')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                    TextInput::make('review_data.ratings.sound')
                                                        ->label('Audio')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                    TextInput::make('review_data.ratings.graphics')
                                                        ->label('Graphics')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                    TextInput::make('review_data.ratings.presentation')
                                                        ->label('Polish')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                    TextInput::make('review_data.ratings.value')
                                                        ->label('Value')
                                                        ->numeric()
                                                        ->maxValue(10)
                                                        ->placeholder('0'),
                                                ]),
                                            ])
                                            ->compact(),

                                        // Pros & Cons
                                        Grid::make(2)->schema([
                                            \Filament\Forms\Components\Repeater::make('review_data.pros')
                                                ->label('✅ The Good')
                                                ->simple(TextInput::make('item')->placeholder('Add positive point...'))
                                                ->defaultItems(3)
                                                ->addActionLabel('Add Pro'),
                                            \Filament\Forms\Components\Repeater::make('review_data.cons')
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
                                    ])
                                    ->visible(fn(\Filament\Forms\Get $get) => $get('is_review_article')),
                            ]),
                    ])
                    ->columnSpan(['lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('ArticleMeta')
                            ->tabs([
                                // ─────────────────────────────────────────────
                                // TAB: PUBLISH
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('Publish')
                                    ->icon('heroicon-o-paper-airplane')
                                    ->schema([
                                        Select::make('status')
                                            ->label('Status')
                                            ->options([
                                                'draft' => '📝 Draft',
                                                'published' => '🌐 Published',
                                                'scheduled' => '📅 Scheduled',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->native(false)
                                            ->helperText('Set to Published to go live'),

                                        DateTimePicker::make('published_at')
                                            ->label('Publish Date')
                                            ->native(false)
                                            ->displayFormat('M j, Y • g:i A')
                                            ->default(now())
                                            ->helperText('When should this article go live?'),

                                        Select::make('category')
                                            ->label('Category')
                                            ->options([
                                                'reviews' => '🎮 Reviews',
                                                'gaming' => '🕹️ Gaming News',
                                                'console' => '🎯 Console',
                                                'pc' => '💻 PC Gaming',
                                                'movies' => '🎬 Movies & TV',
                                                'industry' => '📊 Industry',
                                                'esport' => '🏆 Esports',
                                                'opinions' => '💭 Opinions',
                                                'guides' => '📚 Guides',
                                                'hardware' => '🔧 Hardware',
                                            ])
                                            ->required()
                                            ->native(false)
                                            ->searchable(),

                                        Select::make('author_id')
                                            ->label('Author')
                                            ->relationship('author', 'username')
                                            ->searchable()
                                            ->preload()
                                            ->required()
                                            ->native(false),

                                        TagsInput::make('tags')
                                            ->label('Tags')
                                            ->placeholder('Add tag...')
                                            ->helperText('Press Enter after each tag'),

                                        Toggle::make('is_featured')
                                            ->label('Feature on Homepage')
                                            ->helperText('Highlight this article in featured sections'),
                                    ]),

                                // ─────────────────────────────────────────────
                                // TAB: SEO
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn($get) => $get('focus_keyword') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema([
                                        TextInput::make('focus_keyword')
                                            ->label('Focus Keyword')
                                            ->placeholder('e.g. best gaming keyboard 2024')
                                            ->helperText('Primary keyword for SEO optimization'),

                                        TextInput::make('meta_title')
                                            ->label('SEO Title')
                                            ->placeholder('Custom title for search engines...')
                                            ->maxLength(70)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/70 chars' . (strlen($state) >= 50 && strlen($state) <= 60 ? ' ✓ Optimal' : ''))
                                                : 'Leave empty to use article title. Optimal: 50-60 chars'
                                            ),

                                        Textarea::make('meta_description')
                                            ->label('Meta Description')
                                            ->placeholder('Compelling description for search results...')
                                            ->rows(3)
                                            ->maxLength(160)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/160 chars' . (strlen($state) >= 150 && strlen($state) <= 160 ? ' ✓ Optimal' : ''))
                                                : 'Optimal: 150-160 characters'
                                            ),

                                        TextInput::make('canonical_url')
                                            ->label('Canonical URL')
                                            ->placeholder('https://...')
                                            ->url()
                                            ->helperText('Leave empty for default URL'),

                                        Toggle::make('is_noindex')
                                            ->label('Hide from Search Engines')
                                            ->helperText('Enable to prevent Google indexing'),
                                    ]),

                                // ─────────────────────────────────────────────
                                // TAB: MEDIA
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema([
                                        FileUpload::make('featured_image_url')
                                            ->label('Featured Image')
                                            ->image()
                                            ->disk('public')
                                            ->directory('articles')
                                            ->visibility('public')
                                            ->imageEditor()
                                            ->imageEditorAspectRatios([
                                                '16:9',
                                                '4:3',
                                                '1:1',
                                            ])
                                            ->maxSize(2048)
                                            ->helperText('Recommended: 1200×630px for social sharing'),

                                        TextInput::make('featured_image_alt')
                                            ->label('Image Alt Text')
                                            ->placeholder('Describe the image for accessibility...')
                                            ->helperText('Important for SEO and accessibility'),
                                    ]),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}

