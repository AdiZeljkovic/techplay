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
        return 'Content';
    }

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
                \Filament\Schemas\Components\Grid::make(3)
                    ->schema([
                        // Main Content (Left)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 2])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Article Content')
                                    ->icon('heroicon-m-cpu-chip')
                                    ->schema([
                                        TextInput::make('title')
                                            ->required()
                                            ->maxLength(255)
                                            ->live(onBlur: true)
                                            ->afterStateUpdated(fn($state, Set $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                                        TextInput::make('slug')
                                            ->required()
                                            ->maxLength(255)
                                            ->unique(ignoreRecord: true),

                                        Textarea::make('excerpt')
                                            ->rows(3)
                                            ->columnSpanFull(),

                                        RichEditor::make('content')
                                            ->required()
                                            ->fileAttachmentsDisk('public')
                                            ->fileAttachmentsDirectory('articles')
                                            ->columnSpanFull(),
                                    ]),

                                SeoForm::make(),
                            ]),

                        // Sidebar (Right)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 1])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Publishing')
                                    ->icon('heroicon-m-rocket-launch')
                                    ->schema([
                                        Select::make('status')
                                            ->options([
                                                'draft' => 'Draft',
                                                'ready_for_review' => 'Ready for Review',
                                                'published' => 'Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->selectablePlaceholder(false),

                                        DateTimePicker::make('published_at')
                                            ->default(now()),

                                        Select::make('author_id')
                                            ->relationship('author', 'name')
                                            ->default(fn() => auth()->id())
                                            ->required()
                                            ->searchable(),

                                        Toggle::make('is_featured_in_hero')
                                            ->label('Show in Hero Section')
                                            ->default(false),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Taxonomy')
                                    ->icon('heroicon-m-tag')
                                    ->schema([
                                        Select::make('category_id')
                                            ->label('Category')
                                            ->options(Category::where('type', 'tech')->whereNotNull('parent_id')->pluck('name', 'id'))
                                            ->searchable()
                                            ->required(),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Media')
                                    ->icon('heroicon-m-photo')
                                    ->schema([
                                        FileUpload::make('featured_image_url')
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
