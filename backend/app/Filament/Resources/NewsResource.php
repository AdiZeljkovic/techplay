<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsResource\Pages;
use App\Models\Article;
use App\Models\Category;
use Filament\Forms;
use Filament\Forms\Components\Tabs;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Set;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Illuminate\Database\Eloquent\Builder;

class NewsResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static ?string $modelPolicy = \App\Policies\NewsPolicy::class;

    protected static ?string $slug = 'news-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }
    protected static ?int $navigationSort = 1;

    public static function getNavigationLabel(): string
    {
        return 'News';
    }

    public static function getModelLabel(): string
    {
        return 'News Article';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereHas('category', function ($query) {
                $query->where('type', 'news');
            })
            ->with(['category', 'author']);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT COLUMN - MAIN CONTENT AREA (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        // TITLE SECTION - Clean, prominent
                        Section::make()
                            ->schema([
                                Forms\Components\TextInput::make('title')
                                    ->label('Article Title')
                                    ->placeholder('Write a compelling headline...')
                                    ->required()
                                    ->maxLength(100)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state)))
                                    ->helperText(
                                        fn($state) => $state
                                        ? (strlen($state) . '/100 chars' . (strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
                                        : 'Aim for 50-60 characters for optimal SEO'
                                    ),

                                Grid::make(2)->schema([
                                    Forms\Components\TextInput::make('slug')
                                        ->label('Permalink')
                                        ->prefix('techplay.gg/news/')
                                        ->placeholder('auto-generated-slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->helperText('URL-friendly • Auto-generated from title'),

                                    Forms\Components\Textarea::make('excerpt')
                                        ->label('Excerpt')
                                        ->placeholder('Brief summary for cards and social sharing...')
                                        ->rows(2)
                                        ->maxLength(200)
                                        ->helperText(
                                            fn($state) => $state
                                            ? strlen($state) . '/200 chars'
                                            : 'Short description shown in previews'
                                        ),
                                ]),
                            ])
                            ->compact(),

                        // CONTENT EDITOR
                        Section::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->description('Write your article using the rich text editor. Add images, links, and formatting.')
                            ->schema([
                                Forms\Components\RichEditor::make('content')
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
                                    ->fileAttachmentsDirectory('articles/content'),
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
                                        Forms\Components\Select::make('status')
                                            ->label('Status')
                                            ->options([
                                                'draft' => '📝 Draft',
                                                'ready_for_review' => '👁️ Pending Review',
                                                'published' => '🌐 Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->native(false)
                                            ->helperText('Set to Published to go live'),

                                        Forms\Components\DateTimePicker::make('published_at')
                                            ->label('Publish Date')
                                            ->native(false)
                                            ->displayFormat('M j, Y • g:i A')
                                            ->default(now())
                                            ->helperText('When should this article go live?'),

                                        Forms\Components\Select::make('category_id')
                                            ->label('Category')
                                            ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                            ->searchable()
                                            ->required()
                                            ->native(false),

                                        Forms\Components\TagsInput::make('tags')
                                            ->label('Tags')
                                            ->placeholder('Add tag...')
                                            ->helperText('Press Enter after each tag'),

                                        Forms\Components\Toggle::make('is_featured_in_hero')
                                            ->label('🌟 Feature in Homepage Hero')
                                            ->helperText('Highlight this article at the top of homepage'),

                                        Forms\Components\Hidden::make('author_id')
                                            ->default(fn() => auth()->id()),
                                    ]),

                                // ─────────────────────────────────────────────
                                // TAB: SEO
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema([
                                        Forms\Components\TextInput::make('focus_keyword')
                                            ->label('Focus Keyword')
                                            ->placeholder('e.g. PS5 review, gaming news')
                                            ->helperText('Primary keyword for SEO optimization'),

                                        Forms\Components\TextInput::make('meta_title')
                                            ->label('SEO Title')
                                            ->placeholder('Custom title for search engines...')
                                            ->maxLength(70)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/70 chars' . (strlen($state) >= 50 && strlen($state) <= 60 ? ' ✓ Optimal' : ''))
                                                : 'Leave empty to use article title. Optimal: 50-60 chars'
                                            ),

                                        Forms\Components\Textarea::make('meta_description')
                                            ->label('Meta Description')
                                            ->placeholder('Compelling description for search results...')
                                            ->rows(3)
                                            ->maxLength(160)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/160 chars' . (strlen($state) >= 150 && strlen($state) <= 160 ? ' ✓ Optimal' : ''))
                                                : 'Optimal: 150-160 characters'
                                            ),

                                        Forms\Components\TextInput::make('canonical_url')
                                            ->label('Canonical URL')
                                            ->placeholder('https://...')
                                            ->url()
                                            ->helperText('Leave empty for default URL'),

                                        Forms\Components\Toggle::make('is_noindex')
                                            ->label('Hide from Search Engines')
                                            ->helperText('Enable to prevent Google indexing'),
                                    ]),

                                // ─────────────────────────────────────────────
                                // TAB: MEDIA
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema([
                                        Forms\Components\FileUpload::make('featured_image_url')
                                            ->label('Featured Image')
                                            ->image()
                                            ->disk('public')
                                            ->directory('articles')
                                            ->imageEditor()
                                            ->imageEditorAspectRatios([
                                                '16:9',
                                                '4:3',
                                                '1:1',
                                            ])
                                            ->maxSize(2048)
                                            ->helperText('Recommended: 1200×630px for social sharing'),

                                        Forms\Components\TextInput::make('featured_image_alt')
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
                    ->tooltip(fn($record) => $record->title),
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
                    ->color(fn(string $state): string => match ($state) {
                        'draft' => 'gray',
                        'ready_for_review' => 'warning',
                        'published' => 'success',
                        default => 'gray',
                    }),
                TextColumn::make('views')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
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
                        'published' => 'Published',
                    ]),
                SelectFilter::make('category')
                    ->relationship('category', 'name', fn(Builder $query) => $query->where('type', 'news')),
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

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNews::route('/'),
            'create' => Pages\CreateNews::route('/create'),
            'edit' => Pages\EditNews::route('/{record}/edit'),
        ];
    }
}

