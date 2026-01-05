<?php

namespace App\Filament\Resources\Reviews\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Group;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Filament\Forms\Get;
use Illuminate\Support\Str;
use Filament\Forms\Set;

class ReviewForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Review Details')
                            ->schema([
                                TextInput::make('title')
                                    ->required()
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),

                                TextInput::make('slug')
                                    ->required()
                                    ->unique(ignoreRecord: true),

                                TextInput::make('item_name')
                                    ->label('Game / Product Name')
                                    ->required(),

                                Select::make('category')
                                    ->options([
                                        'game' => 'Game',
                                        'hardware' => 'Hardware',
                                        'peripheral' => 'Peripheral',
                                    ])
                                    ->required(),

                                Textarea::make('summary')
                                    ->rows(3)
                                    ->columnSpanFull(),

                                RichEditor::make('content')
                                    ->label('Full Review')
                                    ->required()
                                    ->columnSpanFull(),
                            ]),

                        // NEW REVIEW DATA SECTION (Replacing Legacy Specs/Scores section gradually or alongside)
                        Section::make('Review Data (New System)')
                            ->schema([
                                Group::make()
                                    ->schema([
                                        Section::make('Game / Product Info')
                                            ->schema([
                                                \Filament\Forms\Components\Grid::make(3)
                                                    ->schema([
                                                        TextInput::make('review_data.game_title')->label('Title')->required(),
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
                                                \Filament\Forms\Components\Grid::make(2)
                                                    ->schema([
                                                        TextInput::make('review_score') // Maps to review_score column
                                                            ->label('Final Score (0.0 - 10.0)')
                                                            ->numeric()
                                                            ->step(0.1)
                                                            ->minValue(0)
                                                            ->maxValue(10)
                                                            ->columnSpan(2),

                                                        TextInput::make('review_data.ratings.gameplay')->label('Gameplay')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.story')->label('Story')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.sound')->label('Sound')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.graphics')->label('Graphics')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.presentation')->label('Presentation')->numeric()->maxValue(10),
                                                        TextInput::make('review_data.ratings.value')->label('Value')->numeric()->maxValue(10),
                                                    ]),
                                            ]),

                                        Section::make('Pros & Cons')
                                            ->schema([
                                                \Filament\Forms\Components\Grid::make(2)
                                                    ->schema([
                                                        \Filament\Forms\Components\Repeater::make('review_data.pros')
                                                            ->label('Positives')
                                                            ->simple(TextInput::make('item')->required()),
                                                        \Filament\Forms\Components\Repeater::make('review_data.cons')
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
                            ])
                            ->collapsible(),

                        // Legacy Sections (Can failover mostly kept for backward compat if needed)
                        Section::make('Legacy Specs (Deprecated)')
                            ->schema([
                                KeyValue::make('specs')
                                    ->label('Technical Specifications')
                                    ->keyLabel('Spec')
                                    ->valueLabel('Value')
                                    ->columnSpanFull(),
                            ])
                            ->visible(fn(Get $get) => in_array($get('category'), ['hardware', 'peripheral']))
                            ->collapsed(),
                    ])
                    ->columnSpan(['lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Publishing')
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

                                Select::make('author_id')
                                    ->relationship('author', 'username')
                                    ->searchable()
                                    ->preload()
                                    ->required(),
                            ]),

                        Section::make('Media')
                            ->schema([
                                FileUpload::make('cover_image')
                                    ->image()
                                    ->directory('reviews')
                                    ->required(),
                            ]),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}
