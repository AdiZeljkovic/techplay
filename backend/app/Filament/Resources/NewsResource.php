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
                    // Title
                    Forms\Components\TextInput::make('title')
                        ->label('Title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Enter title here')
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                    // Slug
                    Forms\Components\TextInput::make('slug')
                        ->label('Permalink')
                        ->required()
                        ->maxLength(255)
                        ->prefix('techplay.gg/news/')
                        ->unique(ignoreRecord: true),

                    // Content
                    Forms\Components\RichEditor::make('content')
                        ->label('Content')
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

                    // Excerpt
                    Forms\Components\Textarea::make('excerpt')
                        ->label('Excerpt')
                        ->placeholder('Brief summary for article previews...')
                        ->rows(2),

                    // Featured Image
                    Forms\Components\FileUpload::make('featured_image_url')
                        ->label('Featured Image')
                        ->image()
                        ->disk('public')
                        ->directory('articles')
                        ->imageEditor()
                        ->imagePreviewHeight('200'),

                    // Status, Date, Category row
                    Grid::make(3)
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
                                    ->label('Publish Date')
                                    ->default(now())
                                    ->native(false),

                                Forms\Components\Select::make('category_id')
                                    ->label('Category')
                                    ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                    ->searchable()
                                    ->required()
                                    ->native(false),
                            ]),

                    // Tags
                    Forms\Components\TagsInput::make('tags')
                        ->label('Tags')
                        ->placeholder('Add tags...'),

                    // Feature toggle
                    Forms\Components\Toggle::make('is_featured_in_hero')
                        ->label('Feature in Homepage Hero'),

                    // SEO - collapsible
                    Section::make('SEO Settings')
                        ->schema([
                                Forms\Components\TextInput::make('meta_title')
                                    ->label('SEO Title')
                                    ->placeholder('Custom SEO title'),
                                Forms\Components\Textarea::make('meta_description')
                                    ->label('SEO Description')
                                    ->placeholder('Meta description...')
                                    ->rows(2),
                            ])
                        ->collapsible()
                        ->collapsed(),

                    Forms\Components\Hidden::make('author_id')
                        ->default(fn() => auth()->id()),
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
