<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsResource\Pages;
use App\Models\Article;
use App\Models\Category;
use Filament\Forms;
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

class NewsResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static ?string $modelPolicy = \App\Policies\NewsPolicy::class;

    protected static ?string $slug = 'news-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content';
    }

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
                \Filament\Schemas\Components\Grid::make(3)
                    ->schema([
                        // Main Content (Left)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 2])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Article Content')
                                    ->schema([
                                        Forms\Components\TextInput::make('title')
                                            ->required()
                                            ->maxLength(255)
                                            ->live(onBlur: true)
                                            ->afterStateUpdated(fn($state, Set $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                                        Forms\Components\TextInput::make('slug')
                                            ->required()
                                            ->maxLength(255)
                                            ->unique(ignoreRecord: true),

                                        Forms\Components\Textarea::make('excerpt')
                                            ->rows(3)
                                            ->columnSpanFull(),

                                        Forms\Components\RichEditor::make('content')
                                            ->required()
                                            ->columnSpanFull(),
                                    ]),

                                \App\Filament\Components\SeoForm::make(),
                            ]),

                        // Sidebar (Right)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 1])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Publishing')
                                    ->schema([
                                        Forms\Components\Select::make('status')
                                            ->options([
                                                'draft' => 'Draft',
                                                'ready_for_review' => 'Ready for Review',
                                                'published' => 'Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->selectablePlaceholder(false),

                                        Forms\Components\DateTimePicker::make('published_at')
                                            ->default(now()),

                                        Forms\Components\Hidden::make('author_id')
                                            ->default(fn() => auth()->id()),

                                        Forms\Components\Toggle::make('is_featured_in_hero')
                                            ->label('Show in Hero Section')
                                            ->default(false),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Taxonomy')
                                    ->schema([
                                        Forms\Components\Select::make('category_id')
                                            ->label('Category')
                                            ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                            ->searchable()
                                            ->required(),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Media')
                                    ->schema([
                                        Forms\Components\FileUpload::make('featured_image_url')
                                            ->label('Featured Image')
                                            ->image()
                                            ->disk('public')
                                            ->directory('articles')
                                            ->imageEditor(),
                                    ]),
                            ]),
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
