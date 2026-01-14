<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TechResource\Pages;
use App\Models\Article;
use App\Models\Category;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use App\Filament\Components\SeoForm;
use Filament\Schemas\Components\Utilities\Set;
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

class TechResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static ?string $slug = 'tech-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }
    protected static ?int $navigationSort = 5;

    public static function getNavigationLabel(): string
    {
        return 'Tech';
    }

    public static function getModelLabel(): string
    {
        return 'Tech Article';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereHas('category', function ($query) {
                $query->where('type', 'tech');
            });
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    // Title
                    TextInput::make('title')
                        ->label('Title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Enter title here')
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                    // Slug
                    TextInput::make('slug')
                        ->label('Permalink')
                        ->required()
                        ->maxLength(255)
                        ->prefix('techplay.gg/tech/')
                        ->unique(ignoreRecord: true),

                    // Content
                    RichEditor::make('content')
                        ->label('Content')
                        ->required()
                        ->placeholder('Start writing your article...')
                        ->fileAttachmentsDisk('public')
                        ->fileAttachmentsDirectory('articles'),

                    // Excerpt
                    Textarea::make('excerpt')
                        ->label('Excerpt')
                        ->placeholder('Brief summary for article previews...')
                        ->rows(2),

                    // Featured Image
                    FileUpload::make('featured_image_url')
                        ->label('Featured Image')
                        ->image()
                        ->disk('public')
                        ->directory('articles')
                        ->imageEditor()
                        ->imagePreviewHeight('200'),

                    // Status, Date, Category row
                    Grid::make(3)
                        ->schema([
                                Select::make('status')
                                    ->label('Status')
                                    ->options([
                                            'draft' => 'Draft',
                                            'ready_for_review' => 'Pending Review',
                                            'published' => 'Published',
                                        ])
                                    ->default('draft')
                                    ->required()
                                    ->native(false),

                                DateTimePicker::make('published_at')
                                    ->label('Publish Date')
                                    ->default(now())
                                    ->native(false),

                                Select::make('category_id')
                                    ->label('Category')
                                    ->options(Category::where('type', 'tech')->whereNotNull('parent_id')->pluck('name', 'id'))
                                    ->searchable()
                                    ->required()
                                    ->native(false),
                            ]),

                    // Tags
                    \Filament\Forms\Components\TagsInput::make('tags')
                        ->label('Tags')
                        ->placeholder('Add tags...'),

                    // Feature toggle
                    Toggle::make('is_featured_in_hero')
                        ->label('Feature in Homepage Hero'),

                    // SEO - collapsible
                    Section::make('SEO Settings')
                        ->schema([
                                TextInput::make('meta_title')
                                    ->label('SEO Title')
                                    ->placeholder('Custom SEO title'),
                                Textarea::make('meta_description')
                                    ->label('SEO Description')
                                    ->placeholder('Meta description...')
                                    ->rows(2),
                            ])
                        ->collapsible()
                        ->collapsed(),

                    Hidden::make('author_id')
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
                        ->relationship('category', 'name', fn(Builder $query) => $query->where('type', 'tech')),
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
            'index' => Pages\ListTeches::route('/'),
            'create' => Pages\CreateTech::route('/create'),
            'edit' => Pages\EditTech::route('/{record}/edit'),
        ];
    }
}
