<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReviewResource\Pages;
use App\Models\Article;
use App\Models\Category;

// Layout Components (from Schemas)
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Tabs;

// Form Field Components (from Forms)
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Forms\Get;
use Filament\Actions\Action; // Changed from Forms\Components\Actions\Action
use App\Services\RawgService;
use Filament\Notifications\Notification; // Set is likely in Forms or Support, assuming Forms based on previous usage

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

class ReviewResource extends Resource
{
    protected static ?string $model = Article::class;

    protected static ?string $modelPolicy = \App\Policies\ArticlePolicy::class;

    protected static ?string $slug = 'review-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }
    protected static ?int $navigationSort = 2;

    public static function getNavigationLabel(): string
    {
        return 'Reviews';
    }

    public static function getModelLabel(): string
    {
        return 'Review';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['author', 'category']) // Eager load to prevent N+1 queries
            ->whereHas('category', function ($query) {
                $query->where('type', 'reviews');
            });
    }

    public static function form(Schema $schema): Schema
    {
        $calculateScore = function ($get, $set) {
            $gameplay = (float) $get('review_data.ratings.gameplay');
            $visuals = (float) $get('review_data.ratings.visuals');
            $audio = (float) $get('review_data.ratings.audio');
            $narrative = (float) $get('review_data.ratings.narrative');
            $replayability = (float) $get('review_data.ratings.replayability');

            $average = ($gameplay + $visuals + $audio + $narrative + $replayability) / 5;

            $set('review_score', number_format($average, 1));
        };

        return $schema
            ->components([
                    // Title
                    TextInput::make('title')
                        ->label('Review Title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Enter review title here')
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),

                    // Slug
                    TextInput::make('slug')
                        ->label('Permalink')
                        ->required()
                        ->maxLength(255)
                        ->prefix('techplay.gg/reviews/')
                        ->unique(ignoreRecord: true),

                    // Game Details Section
                    Section::make('Game / Product Details')
                        ->schema([
                                Grid::make(2)
                                    ->schema([
                                            TextInput::make('review_data.game_title')
                                                ->label('Game Title')
                                                ->required()
                                                ->suffixAction(
                                                    Action::make('fill_from_rawg')
                                                        ->icon('heroicon-o-cloud-arrow-down')
                                                        ->tooltip('Auto-fill from RAWG.io')
                                                        ->form([
                                                                Select::make('game_slug')
                                                                    ->label('Search Game')
                                                                    ->searchable()
                                                                    ->getSearchResultsUsing(function (string $search) {
                                                                        $service = new RawgService();
                                                                        $results = $service->searchGames($search);
                                                                        if (!$results || !isset($results['results']))
                                                                            return [];
                                                                        return collect($results['results'])
                                                                            ->mapWithKeys(fn($game) => [$game['slug'] => "{$game['name']} (" . substr($game['released'] ?? 'N/A', 0, 4) . ")"])
                                                                            ->toArray();
                                                                    })
                                                                    ->required(),
                                                            ])
                                                        ->action(function (array $data, $set) {
                                                            $service = new RawgService();
                                                            $details = $service->getGameDetails($data['game_slug']);
                                                            if (!$details) {
                                                                Notification::make()->title('Failed to fetch data')->danger()->send();
                                                                return;
                                                            }
                                                            $set('review_data.game_title', $details['name']);
                                                            $set('review_data.developer', $details['developers'][0]['name'] ?? null);
                                                            $set('review_data.publisher', $details['publishers'][0]['name'] ?? null);
                                                            $set('review_data.release_date', $details['released'] ?? null);
                                                            if (isset($details['parent_platforms'])) {
                                                                $set('review_data.platforms', collect($details['parent_platforms'])->pluck('platform.name')->toArray());
                                                            }
                                                            if (isset($details['genres'])) {
                                                                $set('review_data.genres', collect($details['genres'])->pluck('name')->map(fn($g) => strtolower($g))->toArray());
                                                            }
                                                            Notification::make()->title('Data filled from RAWG')->success()->send();
                                                        })
                                                ),
                                            TextInput::make('review_data.developer')->label('Developer'),
                                            TextInput::make('review_data.publisher')->label('Publisher'),
                                            DateTimePicker::make('review_data.release_date')->label('Release Date'),
                                            TagsInput::make('review_data.platforms')->label('Platforms')->suggestions(['PC', 'PS5', 'Xbox', 'Switch']),
                                            TagsInput::make('review_data.genres')->label('Genres')->suggestions(['Action', 'RPG', 'FPS']),
                                        ]),
                            ])
                        ->collapsible(),

                    // Content
                    RichEditor::make('content')
                        ->label('Review Content')
                        ->required()
                        ->placeholder('Write your review...'),

                    // Excerpt
                    Textarea::make('excerpt')
                        ->label('Excerpt')
                        ->placeholder('Brief summary for previews...')
                        ->rows(2),

                    // Featured Image
                    FileUpload::make('featured_image_url')
                        ->label('Featured Image')
                        ->image()
                        ->disk('public')
                        ->directory('articles')
                        ->imageEditor()
                        ->imagePreviewHeight('200'),

                    // Ratings Section
                    Section::make('Score Board')
                        ->schema([
                                TextInput::make('review_score')
                                    ->label('Final Score')
                                    ->readOnly()
                                    ->dehydrated()
                                    ->numeric()
                                    ->extraInputAttributes(['class' => 'text-3xl font-bold text-center']),
                                Grid::make(5)
                                    ->schema([
                                            TextInput::make('review_data.ratings.gameplay')->label('Gameplay')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                            TextInput::make('review_data.ratings.visuals')->label('Visuals')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                            TextInput::make('review_data.ratings.audio')->label('Audio')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                            TextInput::make('review_data.ratings.narrative')->label('Narrative')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                            TextInput::make('review_data.ratings.replayability')->label('Replay')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                        ]),
                                Select::make('review_data.cta')
                                    ->label('Recommendation')
                                    ->options(['none' => 'No CTA', 'recommended' => 'Recommended', 'must_play' => 'Must Play', 'skip' => 'Skip', 'wait_sale' => 'Wait for Sale'])
                                    ->default('none'),
                            ])
                        ->collapsible(),

                    // Pros/Cons Section
                    Section::make('Verdict')
                        ->schema([
                                Grid::make(2)
                                    ->schema([
                                            Repeater::make('review_data.pros')->label('Positives')->simple(TextInput::make('item')->required()),
                                            Repeater::make('review_data.cons')->label('Negatives')->simple(TextInput::make('item')->required()),
                                        ]),
                                RichEditor::make('review_data.conclusion')->label('Conclusion'),
                            ])
                        ->collapsible()
                        ->collapsed(),

                    // Status, Date, Category row
                    Grid::make(3)
                        ->schema([
                                Select::make('status')
                                    ->label('Status')
                                    ->options(['draft' => 'Draft', 'ready_for_review' => 'Pending Review', 'published' => 'Published'])
                                    ->default('draft')
                                    ->required()
                                    ->native(false),
                                DateTimePicker::make('published_at')
                                    ->label('Publish Date')
                                    ->default(now())
                                    ->native(false),
                                Select::make('category_id')
                                    ->label('Category')
                                    ->options(Category::where('type', 'reviews')->whereNotNull('parent_id')->pluck('name', 'id'))
                                    ->searchable()
                                    ->required()
                                    ->native(false),
                            ]),

                    // Tags
                    TagsInput::make('tags')
                        ->label('Tags')
                        ->placeholder('Add tags...'),

                    // Feature toggle
                    Toggle::make('is_featured_in_hero')
                        ->label('Feature in Homepage Hero'),

                    // SEO - collapsible
                    Section::make('SEO Settings')
                        ->schema([
                                TextInput::make('meta_title')->label('SEO Title')->placeholder('Custom SEO title'),
                                Textarea::make('meta_description')->label('SEO Description')->placeholder('Meta description...')->rows(2),
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
                        ->relationship('category', 'name', fn(Builder $query) => $query->where('type', 'reviews')),
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
            'index' => Pages\ListReviews::route('/'),
            'create' => Pages\CreateReview::route('/create'),
            'edit' => Pages\EditReview::route('/{record}/edit'),
        ];
    }
}
