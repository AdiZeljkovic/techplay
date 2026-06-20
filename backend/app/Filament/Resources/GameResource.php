<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GameResource\Pages;
use App\Models\Game;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;

class GameResource extends Resource
{
    protected static ?string $model = Game::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-puzzle-piece';

    protected static ?string $slug = 'games-database';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function getNavigationLabel(): string
    {
        return 'Games';
    }

    public static function getModelLabel(): string
    {
        return 'Game';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3])
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT — MAIN CONTENT (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Section::make()
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->label('Game Title')
                                    ->required()
                                    ->maxLength(500)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),

                                Forms\Components\TextInput::make('slug')
                                    ->label('Slug')
                                    ->prefix('techplay.gg/games/')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                            ])
                            ->compact(),

                        Section::make('Description')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\Textarea::make('description')
                                    ->label('')
                                    ->placeholder('Write a description for this game...')
                                    ->rows(8)
                                    ->helperText('This is the main game description shown on the game page.'),
                            ]),

                        Section::make('Cover Image')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                Forms\Components\TextInput::make('background_image')
                                    ->label('Image URL')
                                    ->placeholder('https://...')
                                    ->url()
                                    ->helperText('Paste direct image URL (JPG/PNG)'),

                                Forms\Components\Placeholder::make('background_image_preview')
                                    ->label('Preview')
                                    ->content(fn ($get) => new HtmlString(
                                        $get('background_image')
                                            ? '<img src="'.e($get('background_image')).'" style="max-height:200px;border-radius:6px;object-fit:cover;" />'
                                            : '<span style="color:#6b7280">No image set</span>'
                                    )),
                            ]),

                        Section::make('Screenshots')
                            ->icon('heroicon-o-camera')
                            ->collapsed()
                            ->schema([
                                Forms\Components\Repeater::make('short_screenshots')
                                    ->label('')
                                    ->schema([
                                        Forms\Components\TextInput::make('image')
                                            ->label('Screenshot URL')
                                            ->url()
                                            ->placeholder('https://...')
                                            ->required(),
                                    ])
                                    ->addActionLabel('Add Screenshot')
                                    ->defaultItems(0)
                                    ->maxItems(10)
                                    ->reorderable()
                                    ->helperText('Add up to 10 screenshot URLs'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT — SIDEBAR (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Section::make('Details')
                            ->icon('heroicon-o-information-circle')
                            ->schema([
                                Forms\Components\DatePicker::make('released')
                                    ->label('Release Date')
                                    ->native(false)
                                    ->displayFormat('M j, Y'),

                                Grid::make(2)->schema([
                                    Forms\Components\TextInput::make('rating')
                                        ->label('Rating')
                                        ->numeric()
                                        ->minValue(0)
                                        ->maxValue(5)
                                        ->step(0.01)
                                        ->placeholder('0.00')
                                        ->suffix('/ 5'),

                                    Forms\Components\TextInput::make('metacritic')
                                        ->label('Metacritic')
                                        ->numeric()
                                        ->minValue(0)
                                        ->maxValue(100)
                                        ->placeholder('0')
                                        ->suffix('/ 100'),
                                ]),

                                Forms\Components\TextInput::make('moby_id')
                                    ->label('MobyGames ID')
                                    ->numeric()
                                    ->disabled()
                                    ->helperText('Auto-populated from MobyGames import'),
                            ]),

                        Section::make('Taxonomy')
                            ->icon('heroicon-o-tag')
                            ->schema([
                                Forms\Components\TagsInput::make('genre_names')
                                    ->label('Genres')
                                    ->placeholder('Add genre...')
                                    ->helperText('e.g. Action, RPG, Strategy'),

                                Forms\Components\TagsInput::make('platform_names')
                                    ->label('Platforms')
                                    ->placeholder('Add platform...')
                                    ->helperText('e.g. PC, PlayStation 5, Xbox Series'),

                                Forms\Components\TagsInput::make('tag_names')
                                    ->label('Tags')
                                    ->placeholder('Add tag...')
                                    ->helperText('Additional keywords'),
                            ]),

                        Section::make('Enrichment Status')
                            ->icon('heroicon-o-check-circle')
                            ->schema([
                                Forms\Components\Toggle::make('has_description')
                                    ->label('Has Description')
                                    ->disabled()
                                    ->helperText('Auto-managed — set when description is saved'),

                                Forms\Components\DateTimePicker::make('details_crawled_at')
                                    ->label('Last Enriched')
                                    ->native(false)
                                    ->displayFormat('M j, Y H:i')
                                    ->helperText('Set this to now when manually enriching'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('background_image')
                    ->label('')
                    ->width(60)
                    ->height(40)
                    ->defaultImageUrl('/images/placeholder-game.png'),

                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->limit(45)
                    ->tooltip(fn ($record) => $record->name),

                TextColumn::make('rating')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 4.0 => 'success',
                        $state >= 2.5 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn ($state) => $state ? number_format($state, 2) : '—'),

                TextColumn::make('metacritic')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 75 => 'success',
                        $state >= 50 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn ($state) => $state ?: '—')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('released')
                    ->label('Released')
                    ->date('Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('platform_names')
                    ->label('Platforms')
                    ->badge()
                    ->color('info')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(),

                TextColumn::make('genre_names')
                    ->label('Genres')
                    ->badge()
                    ->color('gray')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(isToggledHiddenByDefault: true),

                IconColumn::make('has_description')
                    ->label('Desc')
                    ->boolean()
                    ->trueIcon('heroicon-s-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                IconColumn::make('screenshots_crawled_at')
                    ->label('Screenshots')
                    ->boolean()
                    ->trueIcon('heroicon-s-photo')
                    ->falseIcon('heroicon-o-photo')
                    ->trueColor('success')
                    ->falseColor('gray'),
            ])
            ->defaultSort('rating', 'desc')
            ->filters([
                TernaryFilter::make('has_description')
                    ->label('Description')
                    ->trueLabel('Has description')
                    ->falseLabel('Needs description')
                    ->placeholder('All games'),

                TernaryFilter::make('screenshots_crawled_at')
                    ->label('Screenshots')
                    ->queries(
                        true: fn (Builder $q) => $q->whereNotNull('screenshots_crawled_at'),
                        false: fn (Builder $q) => $q->whereNull('screenshots_crawled_at'),
                    )
                    ->trueLabel('Has screenshots')
                    ->falseLabel('No screenshots')
                    ->placeholder('All games'),
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
            'index' => Pages\ListGames::route('/'),
            'create' => Pages\CreateGame::route('/create'),
            'edit' => Pages\EditGame::route('/{record}/edit'),
        ];
    }
}
