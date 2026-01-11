<?php

namespace App\Filament\Resources\Articles\Schemas;

use Filament\Schemas\Schema;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Group;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Utilities\Set;
use Illuminate\Support\Str;

class ArticleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make()
                            ->schema([
                                TextInput::make('title')
                                    ->required()
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),

                                TextInput::make('slug')
                                    ->required()
                                    ->unique(ignoreRecord: true),

                                RichEditor::make('content')
                                    ->required()
                                    ->columnSpanFull(),
                            ]),

                        // REVIEW SECTION
                        Section::make('Review Data')
                            ->schema([
                                Toggle::make('is_review_article')
                                    ->label('Is this a Review?')
                                    ->live()
                                    ->dehydrated(false) // Don't save this field, just use for UI logic
                                    ->afterStateHydrated(fn($component, $state) => $component->state((bool) ($component->getRecord()?->review_data))),

                                Group::make()
                                    ->schema([
                                        // Game Info
                                        Section::make('Game Details')
                                            ->schema([
                                                Grid::make(3)
                                                    ->schema([
                                                        TextInput::make('review_data.game_title')->label('Game Title')->required(),
                                                        TextInput::make('review_data.developer')->label('Developer'),
                                                        TextInput::make('review_data.publisher')->label('Publisher'),

                                                        DateTimePicker::make('review_data.release_date')->label('Release Date'),
                                                        TextInput::make('review_data.play_time')->label('Play Time (e.g. 40h)'),
                                                        TextInput::make('review_data.tested_on')->label('Tested On (Platform)'),

                                                        TextInput::make('review_data.price')->label('Price'),
                                                        TextInput::make('review_data.store_link')->label('Store Link')->url(),
                                                        TextInput::make('review_data.trailer_url')->label('Trailer URL (YouTube)')->url(),
                                                    ]),

                                                TagsInput::make('review_data.platforms')->label('Platforms')->suggestions(['PC', 'PS5', 'Xbox Series X', 'Switch', 'Mobile']),
                                                TagsInput::make('review_data.genres')->label('Genres')->suggestions(['Action', 'RPG', 'FPS', 'Indie', 'Adventure']),
                                                TextInput::make('review_data.provided_by')->label('Provided By (e.g. Developer code)'),
                                            ])
                                            ->collapsed(),

                                        // Ratings
                                        Section::make('Ratings & Score')
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        TextInput::make('review_score')
                                                            ->label('Final Score (0.0 - 10.0)')
                                                            ->numeric()
                                                            ->step(0.1)
                                                            ->minValue(0)
                                                            ->maxValue(10)
                                                            ->columnSpan(2),

                                                        // Breakdown
                                                        TextInput::make('review_data.ratings.gameplay')->label('Gameplay (0-10)')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.story')->label('Story (0-10)')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.sound')->label('Sound/Music (0-10)')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.graphics')->label('Graphics/Tech (0-10)')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.presentation')->label('Presentation (0-10)')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.value')->label('Value (0-10)')->numeric()->maxValue(10),
                                                    ]),
                                            ]),

                                        // Pros / Cons
                                        Section::make('Pros & Cons')
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        \Filament\Forms\Components\Repeater::make('review_data.pros')
                                                            ->label('Positives')
                                                            ->simple(
                                                                TextInput::make('item')->required()
                                                            ),
                                                        \Filament\Forms\Components\Repeater::make('review_data.cons')
                                                            ->label('Negatives')
                                                            ->simple(
                                                                TextInput::make('item')->required()
                                                            ),
                                                    ]),
                                            ]),

                                        RichEditor::make('review_data.conclusion')->label('Verdict / Conclusion'),

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
                                // ->visible(fn (\Filament\Forms\Get $get) => $get('is_review_article')) // Simplify: Always show but collapsable, or use toggle
                            ]),

                        Section::make('SEO')
                            ->schema([
                                TextInput::make('meta_title'),
                                Textarea::make('meta_description'),
                            ])
                            ->collapsed(),
                    ])
                    ->columnSpan(['lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Status & Visibility')
                            ->schema([
                                Select::make('status')
                                    ->options([
                                        'draft' => 'Draft',
                                        'published' => 'Published',
                                        'scheduled' => 'Scheduled',
                                    ])
                                    ->default('draft')
                                    ->required(),

                                DateTimePicker::make('published_at'),

                                Toggle::make('is_featured')
                                    ->label('Feature this article'),

                                Select::make('author_id')
                                    ->relationship('author', 'username')
                                    ->searchable()
                                    ->preload()
                                    ->required(),

                                Select::make('category')
                                    ->options([
                                        'reviews' => 'Reviews', // Added Reviews
                                        'gaming' => 'Gaming',
                                        'console' => 'Console',
                                        'pc' => 'PC',
                                        'movies' => 'Movies & TV',
                                        'industry' => 'Industry',
                                        'esport' => 'E-sport',
                                        'opinions' => 'Opinions',
                                    ])
                                    ->required(),
                            ]),

                        Section::make('Image')
                            ->schema([
                                FileUpload::make('featured_image_url')
                                    ->image()
                                    ->disk('public')
                                    ->directory('articles')
                                    ->visibility('public')
                                    ->imageEditor()
                                    ->maxSize(2048)
                                    ->columnSpanFull(),
                            ]),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}
