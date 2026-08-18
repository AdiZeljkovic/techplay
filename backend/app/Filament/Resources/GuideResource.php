<?php

namespace App\Filament\Resources;

use App\Filament\Components\ArticleEditorFields;
use App\Filament\Components\ArticleTable;
use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\GuideResource\Pages;
use App\Models\Guide;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class GuideResource extends Resource
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
        return ['title', 'slug'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Difficulty' => $record->difficulty, 'Status' => $record->status]);
    }

    protected static ?string $model = Guide::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $slug = 'guides';

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
        return parent::getEloquentQuery()->with(['author']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 40;

    public static function getNavigationLabel(): string
    {
        return 'Guides';
    }

    public static function getModelLabel(): string
    {
        return 'Guide';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3]) // Explicit Grid Definition
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT COLUMN - MAIN CONTENT AREA (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema(array_merge(ArticleEditorFields::make('techplay.gg/guides/', 'guide', 'guides/content'), [
                        // STEPS SECTION - Collapsible
                        Section::make('Step-by-Step Instructions')
                            ->icon('heroicon-o-list-bullet')
                            ->description('Add structured steps with optional images')
                            ->collapsed(false) // Uncollapsed to ensure validation visibility
                            ->collapsible()
                            ->schema([
                                Repeater::make('steps')
                                    ->schema([
                                        TextInput::make('title')
                                            ->label('Step Title')
                                            ->placeholder('e.g. Download the software')
                                            ->required(),
                                        RichEditor::make('description')
                                            ->label('Instructions')
                                            ->toolbarButtons(['bold', 'italic', 'link', 'bulletList']),
                                        FileUpload::make('image')
                                            ->label('Screenshot/Image')
                                            ->image()
                                            ->directory('guides/steps')
                                            ->disk('public'),
                                    ])
                                    ->itemLabel(fn (array $state): ?string => $state['title'] ?? null)
                                    ->collapsible()
                                    ->cloneable()
                                    ->defaultItems(0)
                                    ->addActionLabel('Add Step'),
                            ]),
                    ]))
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('GuideMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                PublishTab::make(
                                    null,
                                    'guide',
                                    withGameLink: true,
                                    withHeroToggle: false,
                                    extra: [PublishTab::difficulty()],
                                    // Guides are their own model on their own
                                    // table; the scheduler only walks Article.
                                    withScheduling: false,
                                    // And `guides` has no `tags` column, so
                                    // every tag typed here used to vanish on save.
                                    withTags: false,
                                ),

                                // TAB: SEO with Live Checker
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[0])
                                    ->badgeColor(fn ($get) => SeoFields::tabBadge(SeoFields::state($get))[1])
                                    /*
                                     * `guides` stores these as `seo_title` and
                                     * `seo_description`. The shared component
                                     * wrote `meta_title` / `meta_description`,
                                     * which `articles` has and this table does
                                     * not — so both fields on this screen were
                                     * discarded on every save while the two
                                     * columns that do exist stayed empty.
                                     */
                                    ->schema(SeoFields::make(
                                        'techplay.gg/guides/',
                                        includeCanonical: true,
                                        titleField: 'seo_title',
                                        descriptionField: 'seo_description',
                                    )),

                                // TAB: MEDIA with Library Picker
                                Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    // No `featured_image_alt` and no
                                    // `featured_video_url` on this table either.
                                    ->schema(MediaPickerFields::make('featured_image_url', null, 'guides', withVideo: false)),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]), // Explicit Span
            ]);
    }

    public static function table(Table $table): Table
    {
        return ArticleTable::configure(
            $table,
            sitePath: 'guides',
            // Guides have no category — they file by difficulty, which rides on
            // the byline under the headline like a section does everywhere else.
            categoryType: null,
            extraFilters: [
                SelectFilter::make('difficulty')
                    ->options([
                        'beginner' => 'Beginner',
                        'intermediate' => 'Intermediate',
                        'advanced' => 'Advanced',
                    ]),
            ],
        )->recordActions([
            Action::make('onSite')
                ->label('View on site')
                ->tooltip('Open on techplay.gg')
                ->icon('heroicon-m-arrow-top-right-on-square')
                ->color('gray')
                ->iconButton()
                ->url(fn ($record): string => config('app.site_url').'/guides/'.$record->slug, shouldOpenInNewTab: true)
                ->visible(fn ($record): bool => filled($record->slug) && $record->status === 'published'),
            EditAction::make()->tooltip('Edit')->iconButton(),
            DeleteAction::make()->tooltip('Delete')->iconButton(),
        ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGuides::route('/'),
            'create' => Pages\CreateGuide::route('/create'),
            'edit' => Pages\EditGuide::route('/{record}/edit'),
        ];
    }
}
