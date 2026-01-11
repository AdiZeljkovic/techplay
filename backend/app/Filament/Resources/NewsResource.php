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
                // Use Flex for a responsive layout that fills the width
                \Filament\Schemas\Components\Flex::make([
                    // Main Content (Left - grows to fill)
                    \Filament\Schemas\Components\Section::make('Article Content')
                        ->icon('heroicon-m-document-text')
                        ->description('Write your article content here.')
                        ->schema([
                            Forms\Components\TextInput::make('title')
                                ->required()
                                ->maxLength(255)
                                ->live(onBlur: true)
                                ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state)))
                                ->columnSpanFull(),

                            Forms\Components\TextInput::make('slug')
                                ->required()
                                ->maxLength(255)
                                ->unique(ignoreRecord: true)
                                ->columnSpanFull(),

                            Forms\Components\Textarea::make('excerpt')
                                ->label('Summary / Excerpt')
                                ->helperText('A brief summary for previews and SEO.')
                                ->rows(3)
                                ->columnSpanFull(),

                            Forms\Components\RichEditor::make('content')
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
                                ->columnSpanFull(),
                        ])
                        ->columns(1)
                        ->grow(),

                    // Sidebar (Right - fixed width)
                    \Filament\Schemas\Components\Section::make('Settings')
                        ->icon('heroicon-m-cog-6-tooth')
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
                                ->selectablePlaceholder(false)
                                ->native(false),

                            Forms\Components\DateTimePicker::make('published_at')
                                ->label('Publish Date')
                                ->default(now())
                                ->native(false),

                            Forms\Components\Hidden::make('author_id')
                                ->default(fn() => auth()->id()),

                            Forms\Components\Toggle::make('is_featured_in_hero')
                                ->label('Feature in Hero')
                                ->helperText('Show prominently on homepage.')
                                ->default(false),

                            Forms\Components\Select::make('category_id')
                                ->label('Category')
                                ->options(Category::where('type', 'news')->whereNotNull('parent_id')->pluck('name', 'id'))
                                ->searchable()
                                ->required()
                                ->native(false),

                            Forms\Components\TagsInput::make('tags')
                                ->placeholder('Add tags...')
                                ->helperText('Press Enter to add a tag.'),

                            Forms\Components\FileUpload::make('featured_image_url')
                                ->label('Featured Image')
                                ->image()
                                ->disk('public')
                                ->directory('articles')
                                ->imageEditor()
                                ->imagePreviewHeight('150'),
                        ])
                        ->collapsible()
                        ->grow(false),
                ])
                    ->from('md'),

                // SEO Section (Full Width Below)
                \App\Filament\Components\SeoForm::make(),
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
