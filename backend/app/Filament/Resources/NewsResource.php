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
                    // WordPress-style 2 column layout
                    Grid::make(['default' => 1, 'lg' => 3])
                        ->schema([
                                // LEFT COLUMN - Main Content Area (2/3 width)
                                Group::make()
                                    ->schema([
                                            // Title Input (no wrapper, like WordPress)
                                            Forms\Components\TextInput::make('title')
                                                ->hiddenLabel()
                                                ->required()
                                                ->maxLength(255)
                                                ->placeholder('Enter title here')
                                                ->extraInputAttributes([
                                                        'style' => 'font-size: 1.5rem; font-weight: 600; padding: 12px 16px;',
                                                        'class' => 'w-full',
                                                    ])
                                                ->live(onBlur: true)
                                                ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                                            // Permalink
                                            Forms\Components\TextInput::make('slug')
                                                ->hiddenLabel()
                                                ->required()
                                                ->maxLength(255)
                                                ->prefix('Permalink: techplay.gg/news/')
                                                ->unique(ignoreRecord: true)
                                                ->extraInputAttributes(['style' => 'font-size: 0.85rem;']),

                                            // Main Content Editor
                                            Forms\Components\RichEditor::make('content')
                                                ->hiddenLabel()
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
                                                    ])
                                                ->fileAttachmentsDisk('public')
                                                ->fileAttachmentsDirectory('articles/content'),

                                            // Excerpt Metabox
                                            Section::make('Excerpt')
                                                ->schema([
                                                        Forms\Components\Textarea::make('excerpt')
                                                            ->hiddenLabel()
                                                            ->placeholder('Write a brief summary...')
                                                            ->rows(3),
                                                    ])
                                                ->collapsible()
                                                ->collapsed(),

                                            // SEO Metabox
                                            Section::make('SEO Settings')
                                                ->schema([
                                                        Forms\Components\TextInput::make('meta_title')
                                                            ->label('Title')
                                                            ->placeholder('Custom SEO title'),

                                                        Forms\Components\Textarea::make('meta_description')
                                                            ->label('Description')
                                                            ->placeholder('Meta description for search engines...')
                                                            ->rows(2),
                                                    ])
                                                ->collapsible()
                                                ->collapsed(),
                                        ])
                                    ->columnSpan(['lg' => 2]),

                                // RIGHT COLUMN - Sidebar (1/3 width)
                                Group::make()
                                    ->schema([
                                            // Publish Box
                                            Section::make('Publish')
                                                ->schema([
                                                        Forms\Components\Select::make('status')
                                                            ->label('Status')
                                                            ->options([
                                                                    'draft' => 'Draft',
                                                                    'ready_for_review' => 'Pending Review',
                                                                    'published' => 'Published',
                                                                ])
                                                            ->default('draft')
                                                            ->required()
                                                            ->native(false),

                                                        Forms\Components\DateTimePicker::make('published_at')
                                                            ->label('Publish')
                                                            ->default(now())
                                                            ->native(false),

                                                        Forms\Components\Toggle::make('is_featured_in_hero')
                                                            ->label('Feature in Hero'),

                                                        Forms\Components\Hidden::make('author_id')
                                                            ->default(fn() => auth()->id()),
                                                    ]),

                                            // Categories Box
                                            Section::make('Category')
                                                ->schema([
                                                        Forms\Components\Select::make('category_id')
                                                            ->hiddenLabel()
                                                            ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                                            ->searchable()
                                                            ->required()
                                                            ->native(false)
                                                            ->placeholder('Select category...'),
                                                    ]),

                                            // Tags Box
                                            Section::make('Tags')
                                                ->schema([
                                                        Forms\Components\TagsInput::make('tags')
                                                            ->hiddenLabel()
                                                            ->placeholder('Add tags...'),
                                                    ]),

                                            // Featured Image Box
                                            Section::make('Featured Image')
                                                ->schema([
                                                        Forms\Components\FileUpload::make('featured_image_url')
                                                            ->hiddenLabel()
                                                            ->image()
                                                            ->disk('public')
                                                            ->directory('articles')
                                                            ->imageEditor()
                                                            ->imagePreviewHeight('150'),
                                                    ])
                                                ->collapsible(),
                                        ])
                                    ->columnSpan(['lg' => 1]),
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
