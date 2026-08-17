<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\NewsResource\Pages;
use App\Filament\Resources\NewsResource\RelationManagers\ContentVersionsRelationManager;
use App\Models\Article;
use App\Models\Game;
use App\Policies\NewsPolicy;
use App\Services\CacheService;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class NewsResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-newspaper';

    protected static ?string $modelPolicy = NewsPolicy::class;

    protected static ?string $slug = 'news-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 20;

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
            ->columns(['default' => 1, 'lg' => 3]) // Explicit Grid Definition
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
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state)))
                                    ->helperText(
                                        fn ($state) => $state
                                        ? (strlen($state).'/100 chars'.(strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
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
                                            fn ($state) => $state
                                            ? strlen($state).'/200 chars'
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
                                    ->helperText('To embed media, paste the URL or use the attach/video button.')
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
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]), // Explicit Span

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
                                                'scheduled' => '🕐 Scheduled',
                                                'published' => '🌐 Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->native(false)
                                            ->helperText('Use "Scheduled" to auto-publish on the Publish Date'),

                                        Forms\Components\DateTimePicker::make('published_at')
                                            ->label('Publish Date')
                                            ->native(false)
                                            ->displayFormat('M j, Y • g:i A')
                                            ->default(now())
                                            ->helperText('When should this article go live?'),

                                        Forms\Components\Select::make('category_id')
                                            ->label('Category')
                                            ->relationship('category', 'name', function (Builder $query) {
                                                return $query->where('type', 'news')
                                                    ->whereNotNull('parent_id');
                                            })
                                            ->searchable()
                                            ->preload()
                                            ->required()
                                            ->native(false),

                                        Forms\Components\TagsInput::make('tags')
                                            ->label('Tags')
                                            ->placeholder('Add tag...')
                                            ->helperText('Press Enter after each tag'),

                                        Forms\Components\Toggle::make('is_featured_in_hero')
                                            ->label('🌟 Feature in Homepage Hero')
                                            ->helperText('Highlight this article at the top of homepage'),

                                        Forms\Components\Select::make('game_id')
                                            ->label('Linked game')
                                            ->placeholder('Search the games database...')
                                            ->searchable()
                                            ->getSearchResultsUsing(fn (string $search) => Game::query()
                                                ->where('name', 'ilike', "%{$search}%")
                                                ->orderByDesc('rating')
                                                ->limit(20)
                                                ->pluck('name', 'id')
                                                ->toArray())
                                            ->getOptionLabelUsing(fn ($value) => Game::find($value)?->name)
                                            ->helperText('Auto-detected from the title on save; set it here to override.'),

                                        Forms\Components\Select::make('author_id')
                                            ->label('Author')
                                            ->options(fn () => CacheService::getAuthors())
                                            ->searchable()
                                            ->default(fn () => auth()->id())
                                            ->required()
                                            ->native(false),
                                    ]),

                                // ─────────────────────────────────────────────
                                // TAB: SEO with Live Checker
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema(SeoFields::make('techplay.gg/news/')),

                                // ─────────────────────────────────────────────
                                // TAB: MEDIA with Library Picker
                                // ─────────────────────────────────────────────
                                Tabs\Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema(MediaPickerFields::make('featured_image_url', 'featured_image_alt', 'articles')),
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
                        'scheduled' => 'Scheduled',
                        'published' => 'Published',
                    ]),
                SelectFilter::make('category')
                    ->relationship('category', 'name', fn (Builder $query) => $query->where('type', 'news')),
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
            'index' => Pages\ListNews::route('/'),
            'create' => Pages\CreateNews::route('/create'),
            'edit' => Pages\EditNews::route('/{record}/edit'),
        ];
    }
}
