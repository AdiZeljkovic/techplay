<?php

namespace App\Filament\Resources;

use App\Filament\Components\ArticleEditorFields;
use App\Filament\Components\ArticleTable;
use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\NewsResource\Pages;
use App\Filament\Resources\NewsResource\RelationManagers\ContentVersionsRelationManager;
use App\Models\Article;
use App\Policies\NewsPolicy;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class NewsResource extends Resource
{
    /**
     * Findable from the top bar.
     *
     * The search box was wired to four resources, none of them the ones
     * anybody looks for. A hit is titled by `$recordTitleAttribute` and
     * matched against the columns below.
     */
    protected static ?string $recordTitleAttribute = 'title';

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
        return ['title', 'slug', 'excerpt'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Section' => $record->category?->name, 'Status' => $record->status]);
    }

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
            ->columns(['default' => 1, 'lg' => 3])
            ->components([
                // The writing surface: headline, permalink, standfirst, body.
                Group::make()
                    ->schema(ArticleEditorFields::make('techplay.gg/news/', 'story'))
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                // Everything that is *about* the piece rather than part of it.
                Group::make()
                    ->schema([
                        Tabs::make('ArticleMeta')
                            ->tabs([
                                PublishTab::make('news', 'article', withGameLink: true),

                                Tabs\Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[0])
                                    ->badgeColor(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[1])
                                    ->schema(SeoFields::make('techplay.gg/news/')),

                                Tabs\Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema(MediaPickerFields::make('featured_image_url', 'featured_image_alt', 'articles')),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return ArticleTable::configure($table, sitePath: 'news', categoryType: 'news');
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
