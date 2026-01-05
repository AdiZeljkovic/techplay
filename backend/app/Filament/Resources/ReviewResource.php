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
use Filament\Forms\Set;
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

    protected static ?string $slug = 'review-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content';
    }

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
                Tabs::make('Tabs')
                    ->tabs([
                        Tab::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                TextInput::make('title')
                                    ->required()
                                    ->maxLength(255)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn($state, $set) => $set('slug', \Illuminate\Support\Str::slug($state))),
                                TextInput::make('slug')
                                    ->required()
                                    ->maxLength(255)
                                    ->unique(ignoreRecord: true),

                                Select::make('category_id')
                                    ->label('Category')
                                    ->options(Category::where('type', 'reviews')->whereNotNull('parent_id')->pluck('name', 'id'))
                                    ->searchable()
                                    ->searchable()
                                    ->required(),

                                TagsInput::make('tags')
                                    ->label('Tags / Keywords')
                                    ->placeholder('Add tags (e.g. RPG, Open World)...')
                                    ->columnSpanFull(),

                                Toggle::make('is_featured_in_hero')
                                    ->label('Show in Hero Section')
                                    ->default(false),

                                RichEditor::make('content')
                                    ->required()
                                    ->columnSpanFull(),

                                Textarea::make('excerpt')
                                    ->rows(3)
                                    ->columnSpanFull(),

                                FileUpload::make('featured_image_url')
                                    ->label('Featured Image')
                                    ->image()
                                    ->directory('articles')
                                    ->columnSpanFull(),

                                Select::make('status')
                                    ->options([
                                        'draft' => 'Draft',
                                        'published' => 'Published',
                                    ])
                                    ->default('draft')
                                    ->required(),

                                DateTimePicker::make('published_at')
                                    ->default(now()),

                                Hidden::make('author_id')
                                    ->default(fn() => auth()->id()),
                            ]),
                        Tab::make('Review Details')
                            ->icon('heroicon-o-star')
                            ->schema([
                                Group::make()
                                    ->schema([
                                        Section::make('Game / Product Info')
                                            ->schema([
                                                Grid::make(3)
                                                    ->schema([
                                                        TextInput::make('review_data.game_title')
                                                            ->label('Title')
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
                                                                                    ->mapWithKeys(function ($game) {
                                                                                        $year = isset($game['released']) ? substr($game['released'], 0, 4) : 'N/A';
                                                                                        return [$game['slug'] => "{$game['name']} ($year)"];
                                                                                    })
                                                                                    ->toArray();
                                                                            })
                                                                            ->getOptionLabelUsing(fn($value) => $value)
                                                                            ->required(),
                                                                    ])
                                                                    ->action(function (array $data, $set) {
                                                                        $service = new RawgService();
                                                                        $details = $service->getGameDetails($data['game_slug']);

                                                                        if (!$details) {
                                                                            Notification::make()
                                                                                ->title('Failed to fetch data')
                                                                                ->danger()
                                                                                ->send();
                                                                            return;
                                                                        }

                                                                        // Fill fields
                                                                        $set('review_data.game_title', $details['name']);
                                                                        $set('review_data.developer', $details['developers'][0]['name'] ?? null);
                                                                        $set('review_data.publisher', $details['publishers'][0]['name'] ?? null);
                                                                        $set('review_data.release_date', $details['released'] ?? null);
                                                                        $set('review_data.play_time', isset($details['playtime']) ? $details['playtime'] . 'h' : null);
                                                                        $set('review_data.store_link', $details['website'] ?? null);

                                                                        // Arrays
                                                                        if (isset($details['parent_platforms'])) {
                                                                            $platforms = collect($details['parent_platforms'])
                                                                                ->pluck('platform.name')
                                                                                ->toArray();
                                                                            // Map common names if needed (e.g. PlayStation -> PS5/PS4)
                                                                            // Simple map for now:
                                                                            $set('review_data.platforms', $platforms);
                                                                        }

                                                                        if (isset($details['genres'])) {
                                                                            $genres = collect($details['genres'])
                                                                                ->pluck('name')
                                                                                ->map(fn($g) => strtolower($g)) // TagsInput suggestions might be lowercase
                                                                                ->toArray();
                                                                            $set('review_data.genres', $genres);
                                                                        }

                                                                        Notification::make()
                                                                            ->title('Data filled from RAWG')
                                                                            ->success()
                                                                            ->send();
                                                                    })
                                                            ),
                                                        TextInput::make('review_data.developer')->label('Developer'),
                                                        TextInput::make('review_data.publisher')->label('Publisher'),

                                                        DateTimePicker::make('review_data.release_date')->label('Release Date'),
                                                        TextInput::make('review_data.play_time')->label('Play Time'),
                                                        TextInput::make('review_data.tested_on')->label('Tested On'),

                                                        TextInput::make('review_data.price')->label('Price'),
                                                        TextInput::make('review_data.store_link')->label('Store Link')->url(),
                                                        TextInput::make('review_data.trailer_url')->label('Trailer URL')->url(),
                                                    ]),

                                                TagsInput::make('review_data.platforms')->label('Platforms')->suggestions(['PC', 'PS5', 'Xbox', 'Switch']),
                                                TagsInput::make('review_data.genres')->label('Genres')->suggestions(['Action', 'RPG', 'FPS']),
                                            ])
                                            ->collapsed(),

                                        Section::make('Ratings & Score')
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        TextInput::make('review_score')
                                                            ->label('Final Score (Auto-calc)')
                                                            ->readOnly()
                                                            ->dehydrated()
                                                            ->numeric()
                                                            ->columnSpanFull(),
                                                        TextInput::make('review_data.ratings.gameplay')->label('Gameplay')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                                        TextInput::make('review_data.ratings.visuals')->label('Visuals')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                                        TextInput::make('review_data.ratings.audio')->label('Audio')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                                        TextInput::make('review_data.ratings.narrative')->label('Narrative')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                                        TextInput::make('review_data.ratings.replayability')->label('Replayability')->numeric()->maxValue(10)->live()->afterStateUpdated($calculateScore),
                                                    ]),
                                            ]),

                                        Section::make('Pros & Cons')
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        Repeater::make('review_data.pros')
                                                            ->label('Positives')
                                                            ->simple(TextInput::make('item')->required()),
                                                        Repeater::make('review_data.cons')
                                                            ->label('Negatives')
                                                            ->simple(TextInput::make('item')->required()),
                                                    ]),
                                            ]),

                                        RichEditor::make('review_data.conclusion')->label('Verdict'),

                                        Select::make('review_data.cta')
                                            ->label('Call To Action')
                                            ->options([
                                                'none' => 'No CTA',
                                                'recommended' => 'Recommended',
                                                'must_play' => 'Must Play',
                                                'skip' => 'Skip',
                                                'wait_sale' => 'Wait for Sale'
                                            ])
                                            ->default('none'),
                                    ])
                            ]),
                        \App\Filament\Components\SeoForm::make(),
                    ])->columnSpanFull(),
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
