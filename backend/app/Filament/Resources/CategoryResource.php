<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CategoryResource\Pages;
use App\Models\Category;
use Closure;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CategoryResource extends Resource
{
    /**
     * Findable from the top bar.
     *
     * The search box was wired to four resources, none of them the ones
     * anybody looks for. A hit is titled by `$recordTitleAttribute` and
     * matched against the columns below.
     */
    protected static ?string $recordTitleAttribute = 'name';

    /**
     * Five hits, not fifty.
     *
     * Filament's default is 50 per resource, and with 142,110 games in the
     * catalogue any common word floods the panel: searching "adi" returned
     * fifty games and buried the two users it was actually looking for. The
     * point of a global search is to show a spread across types and let you
     * pick a lane — for more of one kind, that resource's own list is one
     * click away and has filters.
     */
    protected static int $globalSearchResultsLimit = 5;

    /** @return list<string> */
    public static function getGloballySearchableAttributes(): array
    {
        return ['name', 'slug'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Type' => $record->type]);
    }

    protected static ?string $model = Category::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-tag';

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['parent']);
    }

    /**
     * "Article Categories", not "Categories".
     *
     * This resource and `ForumCategoryResource` are the same `Category` model
     * split by a `type` column — which is correct, and from the sidebar looked
     * like somebody had listed the same screen twice. One word fixes that.
     */
    protected static ?string $navigationLabel = 'Article Categories';

    public static function getNavigationGroup(): ?string
    {
        return 'System';
    }

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Tabs')
                    ->tabs([
                        Tab::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->required()
                                    ->maxLength(255)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(function (Closure $set, ?string $state) {
                                        $set('slug', Str::slug($state));
                                    }),
                                Forms\Components\TextInput::make('slug')
                                    ->required()
                                    ->maxLength(255)
                                    ->unique(ignoreRecord: true),
                                Forms\Components\Select::make('type')
                                    ->options([
                                        'news' => 'News',
                                        'reviews' => 'Reviews',
                                        'tech' => 'Tech/Hardware',
                                        'forum' => 'Forum',
                                    ])
                                    ->required()
                                    ->live(),
                                Forms\Components\Select::make('parent_id')
                                    ->label('Parent Category')
                                    ->relationship('parent', 'name', function ($query) {
                                        // Only show categories that are NOT children themselves (max depth 1 for now)
                                        return $query->whereNull('parent_id');
                                    })
                                    ->searchable()
                                    ->preload()
                                    ->nullable()
                                    // If type is forum, we might want to restrict parents to forum type too, but let's keep it flexible for now or filter in query
                                    ->visible(fn ($get) => $get('type') === 'forum'),
                                Forms\Components\TextInput::make('icon')
                                    ->placeholder('heroicon-o-chat-bubble-left')
                                    ->maxLength(255),
                                Forms\Components\Textarea::make('description')
                                    ->rows(3),
                            ]),
                        Tab::make('SEO')
                            ->icon('heroicon-o-magnifying-glass')
                            ->schema([
                                Forms\Components\TextInput::make('seo_title')
                                    ->label('SEO Title')
                                    ->maxLength(60)
                                    ->helperText('Optimalno 50–60 znakova')
                                    ->columnSpanFull(),
                                Forms\Components\Textarea::make('seo_description')
                                    ->label('Meta Description')
                                    ->maxLength(160)
                                    ->rows(3)
                                    ->helperText('Optimalno 120–160 znakova')
                                    ->columnSpanFull(),
                                Forms\Components\TextInput::make('focus_keyword')
                                    ->label('Focus Keyword')
                                    ->maxLength(255),
                                Forms\Components\TextInput::make('canonical_url')
                                    ->label('Canonical URL')
                                    ->url()
                                    ->maxLength(500),
                                Forms\Components\Toggle::make('is_noindex')
                                    ->label('NoIndex')
                                    ->helperText('Sakrij stranicu od pretraživača'),
                            ]),
                    ])->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('name', 'asc')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('slug'),
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'news' => 'info',
                        'reviews' => 'success',
                        'tech' => 'warning',
                        'forum' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('parent.name')
                    ->label('Parent')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('articles_count')
                    ->counts('articles')
                    ->label('Articles'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'news' => 'News',
                        'reviews' => 'Reviews',
                        'tech' => 'Tech/Hardware',
                        'forum' => 'Forum',
                    ]),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCategories::route('/'),
            'create' => Pages\CreateCategory::route('/create'),
            'edit' => Pages\EditCategory::route('/{record}/edit'),
        ];
    }
}
