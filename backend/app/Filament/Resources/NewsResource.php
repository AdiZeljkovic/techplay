<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsResource\Pages;
use App\Models\Article;
use App\Models\Category;
use Filament\Forms;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Set;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
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
                    // Main Layout: 3-column grid with content spanning 2 columns
                    Grid::make(3)
                        ->schema([
                                // LEFT SIDE - Main Content (spans 2 columns)
                                Group::make()
                                    ->schema([
                                            Section::make('Article Content')
                                                ->icon('heroicon-o-document-text')
                                                ->description('Write your article content here.')
                                                ->schema([
                                                        Forms\Components\TextInput::make('title')
                                                            ->required()
                                                            ->maxLength(255)
                                                            ->placeholder('Enter article title...')
                                                            ->live(onBlur: true)
                                                            ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                                                        Forms\Components\TextInput::make('slug')
                                                            ->required()
                                                            ->maxLength(255)
                                                            ->placeholder('auto-generated-from-title')
                                                            ->unique(ignoreRecord: true)
                                                            ->helperText('URL-friendly version of the title'),

                                                        Forms\Components\Textarea::make('excerpt')
                                                            ->label('Summary / Excerpt')
                                                            ->placeholder('Brief summary for previews and SEO...')
                                                            ->rows(3)
                                                            ->helperText('This appears in article cards and search results'),

                                                        Forms\Components\RichEditor::make('content')
                                                            ->required()
                                                            ->placeholder('Start writing your article...')
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
                                                                ]),
                                                    ]),

                                            // SEO Section
                                            Section::make('Search Engine Optimization')
                                                ->icon('heroicon-o-magnifying-glass')
                                                ->description('Optimize your content for search engines.')
                                                ->schema([
                                                        Forms\Components\TextInput::make('meta_title')
                                                            ->label('Meta Title')
                                                            ->placeholder('Custom title for search engines...')
                                                            ->helperText('Leave empty to use article title'),

                                                        Forms\Components\Textarea::make('meta_description')
                                                            ->label('Meta Description')
                                                            ->placeholder('Brief description for search results...')
                                                            ->rows(3)
                                                            ->helperText('Recommended: 150-160 characters'),
                                                    ])
                                                ->collapsed()
                                                ->collapsible(),
                                        ])
                                    ->columnSpan(2),

                                // RIGHT SIDE - Sidebar (spans 1 column)
                                Group::make()
                                    ->schema([
                                            Section::make('Publish Settings')
                                                ->icon('heroicon-o-clock')
                                                ->schema([
                                                        Forms\Components\Select::make('status')
                                                            ->options([
                                                                    'draft' => '📝 Draft',
                                                                    'ready_for_review' => '👁️ Ready for Review',
                                                                    'published' => '✅ Published',
                                                                ])
                                                            ->default('draft')
                                                            ->required()
                                                            ->native(false),

                                                        Forms\Components\DateTimePicker::make('published_at')
                                                            ->label('Publish Date')
                                                            ->default(now())
                                                            ->native(false)
                                                            ->helperText('Schedule for later or publish now'),

                                                        Forms\Components\Hidden::make('author_id')
                                                            ->default(fn() => auth()->id()),

                                                        Forms\Components\Toggle::make('is_featured_in_hero')
                                                            ->label('Feature in Hero')
                                                            ->helperText('Show prominently on homepage'),
                                                    ]),

                                            Section::make('Category & Tags')
                                                ->icon('heroicon-o-tag')
                                                ->schema([
                                                        Forms\Components\Select::make('category_id')
                                                            ->label('Category')
                                                            ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                                            ->searchable()
                                                            ->required()
                                                            ->native(false)
                                                            ->placeholder('Select category...'),

                                                        Forms\Components\TagsInput::make('tags')
                                                            ->placeholder('Add tags...')
                                                            ->helperText('Press Enter to add'),
                                                    ]),

                                            Section::make('Featured Image')
                                                ->icon('heroicon-o-photo')
                                                ->schema([
                                                        Forms\Components\FileUpload::make('featured_image_url')
                                                            ->label('')
                                                            ->image()
                                                            ->disk('public')
                                                            ->directory('articles')
                                                            ->imageEditor()
                                                            ->imagePreviewHeight('200')
                                                            ->helperText('Recommended: 1200x630px'),
                                                    ]),
                                        ])
                                    ->columnSpan(1),
                            ]),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    TextColumn::make('title')->searchable()->sortable(),
                    TextColumn::make('category.name')->label('Category')->sortable(),
                    IconColumn::make('is_featured_in_hero')->boolean()->label('Hero'),
                    TextColumn::make('status')->badge()->color(fn(string $state): string => match ($state) {
                        'draft' => 'gray',
                        'published' => 'success',
                        default => 'gray',
                    }),
                    TextColumn::make('views')
                        ->numeric()
                        ->sortable()
                        ->toggleable(isToggledHiddenByDefault: true),
                    TextColumn::make('published_at')->dateTime()->sortable(),
                ])
            ->filters([
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
