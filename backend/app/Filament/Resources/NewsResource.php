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
                    // Title & Slug - The essentials first (no section wrapper for clean look)
                    Section::make()
                        ->schema([
                                Forms\Components\TextInput::make('title')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('Enter your article title here...')
                                    ->extraInputAttributes(['style' => 'font-size: 1.25rem; font-weight: 600;'])
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                                Forms\Components\TextInput::make('slug')
                                    ->required()
                                    ->maxLength(255)
                                    ->prefix('techplay.gg/news/')
                                    ->unique(ignoreRecord: true),
                            ]),

                    // Main Content Editor
                    Section::make('Content')
                        ->icon('heroicon-o-document-text')
                        ->schema([
                                Forms\Components\Textarea::make('excerpt')
                                    ->label('Summary / Excerpt')
                                    ->placeholder('Write a brief summary that will appear in article previews...')
                                    ->rows(2)
                                    ->helperText('Keep under 160 characters for best SEO'),

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
                                        ])
                                    ->fileAttachmentsDisk('public')
                                    ->fileAttachmentsDirectory('articles/content'),
                            ]),

                    // Featured Image
                    Section::make('Featured Image')
                        ->icon('heroicon-o-photo')
                        ->description('Upload a cover image for your article')
                        ->schema([
                                Forms\Components\FileUpload::make('featured_image_url')
                                    ->label('')
                                    ->image()
                                    ->disk('public')
                                    ->directory('articles')
                                    ->imageEditor()
                                    ->imagePreviewHeight('250')
                                    ->helperText('Recommended: 1200x630px (optimized for social sharing)'),
                            ])
                        ->collapsible(),

                    // Publishing Options - Horizontal layout
                    Section::make('Publishing')
                        ->icon('heroicon-o-clock')
                        ->description('Control when and how your article is published')
                        ->schema([
                                Grid::make(3)
                                    ->schema([
                                            Forms\Components\Select::make('status')
                                                ->label('Status')
                                                ->options([
                                                        'draft' => 'Draft',
                                                        'ready_for_review' => 'Ready for Review',
                                                        'published' => 'Published',
                                                    ])
                                                ->default('draft')
                                                ->required()
                                                ->native(false),

                                            Forms\Components\DateTimePicker::make('published_at')
                                                ->label('Publish Date')
                                                ->default(now())
                                                ->native(false),

                                            Forms\Components\Select::make('category_id')
                                                ->label('Category')
                                                ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                                ->searchable()
                                                ->required()
                                                ->native(false)
                                                ->placeholder('Select...'),
                                        ]),

                                Forms\Components\TagsInput::make('tags')
                                    ->placeholder('Add tags and press Enter...'),

                                Forms\Components\Toggle::make('is_featured_in_hero')
                                    ->label('Feature in Homepage Hero')
                                    ->helperText('Display this article prominently on the homepage'),

                                Forms\Components\Hidden::make('author_id')
                                    ->default(fn() => auth()->id()),
                            ])
                        ->collapsible(),

                    // SEO Settings
                    Section::make('SEO Settings')
                        ->icon('heroicon-o-magnifying-glass')
                        ->description('Optimize how your article appears in search engines')
                        ->schema([
                                Forms\Components\TextInput::make('meta_title')
                                    ->label('SEO Title')
                                    ->placeholder('Custom title for search engines (leave empty to use article title)'),

                                Forms\Components\Textarea::make('meta_description')
                                    ->label('SEO Description')
                                    ->placeholder('Brief description for search engine results...')
                                    ->rows(2)
                                    ->helperText('Recommended: 150-160 characters'),
                            ])
                        ->collapsed()
                        ->collapsible(),
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
