<?php

namespace App\Filament\Resources;

use App\Filament\Components\ArticleEditorFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\HelpArticleResource\Pages;
use App\Models\HelpArticle;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Writing an answer.
 *
 * Deliberately not built on `ArticleTable` or `SeoFields`, though every other
 * content resource is:
 *
 *   ArticleTable hard-references `featured_image_url`, `author_id` and
 *   `is_featured_in_hero`. A help article has none of the three, and its hero
 *   filter would throw the moment somebody toggled it.
 *
 *   SeoFields scores a page that has cover art and a standfirst. An answer with
 *   no featured image takes a penalty it can never fix, so a perfectly written
 *   help page would sit permanently below full marks — and a badge that can
 *   never go green is a badge the desk learns to ignore. Its `shorten()` helper
 *   is genuinely shared and is reused below; the scoring is not.
 */
class HelpArticleResource extends Resource
{
    protected static ?string $model = HelpArticle::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-lifebuoy';

    protected static ?string $slug = 'help-articles';

    protected static ?string $recordTitleAttribute = 'title';

    protected static int $globalSearchResultsLimit = 5;

    protected static ?int $navigationSort = 45;

    /** @return list<string> */
    public static function getGloballySearchableAttributes(): array
    {
        return ['title', 'slug'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Topic' => $record->category?->name, 'Status' => $record->status]);
    }

    /** The table draws the topic name; without this that is one query per row. */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['category']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    public static function getNavigationLabel(): string
    {
        return 'Help centre';
    }

    public static function getModelLabel(): string
    {
        return 'Help article';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3])
            ->components([
                Group::make()
                    ->schema(ArticleEditorFields::make(
                        'help.techplay.gg/',
                        'answer',
                        'help/content',
                        // "Standfirst" is newsroom language, and it reads as
                        // nonsense above the field that holds "Turnstile has to
                        // finish before the button unlocks."
                        excerptLabel: 'Short answer',
                    ))
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                Group::make()
                    ->schema([
                        Tabs::make('Sidebar')->tabs([
                            PublishTab::make(
                                null,
                                'answer',
                                withGameLink: false,
                                withHeroToggle: false,
                                extra: [PublishTab::helpCategory(), PublishTab::sortOrder()],
                                withScheduling: false,
                                withTags: false,
                                // help_articles has no author_id — see PublishTab.
                                withAuthor: false,
                            ),

                            Tab::make('Search')
                                ->icon('heroicon-o-magnifying-glass')
                                ->schema([
                                    TextInput::make('seo_title')
                                        ->label('Title in search results')
                                        ->maxLength(70)
                                        ->placeholder(fn ($get) => filled($get('title'))
                                            ? SeoFields::shorten((string) $get('title'))
                                            : null)
                                        ->helperText('Leave empty to use the headline.'),

                                    Textarea::make('seo_description')
                                        ->label('Description in search results')
                                        ->rows(3)
                                        ->maxLength(160)
                                        ->placeholder('Leave empty to use the short answer.')
                                        ->hint(fn ($state) => filled($state)
                                            ? mb_strlen((string) $state).' / 160'
                                            : null)
                                        ->hintColor('gray'),

                                    TextInput::make('focus_keyword')
                                        ->label('What someone would type')
                                        ->placeholder('steam library not syncing')
                                        ->helperText('The phrase this answer should be found by.'),

                                    Toggle::make('is_noindex')
                                        ->label('Hide from search engines')
                                        ->helperText('For answers that only make sense to somebody already here.'),
                                ]),
                        ])->columnSpanFull(),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                TextColumn::make('sort_order')
                    ->label('#')
                    ->sortable()
                    ->alignRight()
                    ->width('1%'),

                TextColumn::make('title')
                    ->searchable()
                    ->wrap()
                    ->weight('medium')
                    ->description(fn (HelpArticle $record): string => trim(
                        ($record->category?->name ?? 'No topic').' · '.
                        match ($record->status) {
                            'published' => 'Published',
                            'ready_for_review' => 'Pending review',
                            default => 'Draft',
                        }
                    )),

                TextColumn::make('views')
                    ->label('Reads')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),

                /*
                 * The two counters as one column.
                 *
                 * Separately they are two numbers nobody compares. Together they
                 * are the only feedback this section produces, and the pair the
                 * desk should be sorting by: an answer being read a lot and
                 * marked unhelpful is the next thing to rewrite.
                 */
                TextColumn::make('helpful_count')
                    ->label('Helped')
                    ->sortable()
                    // `state()` rather than `formatStateUsing()`: this cell is
                    // built from two columns, and formatting only ever sees the
                    // one the column is named after.
                    ->state(fn ($record): string => $record->helpful_count.' up / '.$record->unhelpful_count.' down'),

                TextColumn::make('updated_at')
                    // Help copy is judged by whether it is still true, not by
                    // when it first appeared.
                    ->label('Last reviewed')
                    ->dateTime('M j, Y')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'draft' => 'Draft',
                    'ready_for_review' => 'Pending review',
                    'published' => 'Published',
                ]),
                SelectFilter::make('help_category_id')
                    ->label('Topic')
                    ->relationship('category', 'name'),
            ])
            ->recordActions([
                Action::make('onSite')
                    ->label('View on site')
                    ->tooltip('Open on help.techplay.gg')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->iconButton()
                    ->url(fn (HelpArticle $record): string => config('app.help_url').'/'.$record->category?->slug.'/'.$record->slug, shouldOpenInNewTab: true)
                    ->visible(fn (HelpArticle $record): bool => filled($record->slug)
                        && filled($record->category?->slug)
                        && $record->status === 'published'),
                EditAction::make()->tooltip('Edit')->iconButton(),
                DeleteAction::make()->tooltip('Delete')->iconButton(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListHelpArticles::route('/'),
            'create' => Pages\CreateHelpArticle::route('/create'),
            'edit' => Pages\EditHelpArticle::route('/{record}/edit'),
        ];
    }
}
