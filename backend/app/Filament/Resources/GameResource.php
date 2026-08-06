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
                                Forms\Components\TextInput::make('cover_url')
                                    ->label('Image URL')
                                    ->placeholder('https://...')
                                    ->url()
                                    ->helperText('Paste direct image URL (JPG/PNG)'),

                                Forms\Components\Placeholder::make('cover_preview')
                                    ->label('Preview')
                                    ->content(fn ($get) => new HtmlString(
                                        $get('cover_url')
                                            ? '<img src="'.e($get('cover_url')).'" style="max-height:200px;border-radius:6px;object-fit:cover;" />'
                                            : '<span style="color:#6b7280">No image set</span>'
                                    )),
                            ]),

                        Section::make('Screenshots')
                            ->icon('heroicon-o-camera')
                            ->collapsed()
                            ->schema([
                                Forms\Components\Repeater::make('screenshots')
                                    ->label('')
                                    ->simple(
                                        Forms\Components\TextInput::make('url')
                                            ->label('Screenshot URL')
                                            ->url()
                                            ->placeholder('https://...')
                                            ->required(),
                                    )
                                    ->addActionLabel('Add Screenshot')
                                    ->defaultItems(0)
                                    ->reorderable()
                                    ->helperText('Direct image URLs, in display order'),
                            ]),

                        Section::make('Trailers & Videos')
                            ->icon('heroicon-o-film')
                            ->collapsed()
                            ->schema([
                                Forms\Components\Repeater::make('videos')
                                    ->label('')
                                    ->simple(
                                        Forms\Components\TextInput::make('url')
                                            ->label('Video URL')
                                            ->url()
                                            ->placeholder('https://... (YouTube or direct mp4)')
                                            ->required(),
                                    )
                                    ->addActionLabel('Add Video')
                                    ->defaultItems(0)
                                    ->reorderable()
                                    ->helperText('The first video is the lead trailer'),
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

                                Forms\Components\TextInput::make('rating')
                                    ->label('Rating')
                                    ->numeric()
                                    ->minValue(0)
                                    ->maxValue(5)
                                    ->step(0.01)
                                    ->placeholder('0.00')
                                    ->suffix('/ 5'),

                                Forms\Components\TextInput::make('website')
                                    ->label('Official Website')
                                    ->url()
                                    ->placeholder('https://...'),
                            ]),

                        Section::make('Companies')
                            ->icon('heroicon-o-building-office')
                            ->schema([
                                Forms\Components\TagsInput::make('developers')
                                    ->label('Developers')
                                    ->placeholder('Add developer...'),

                                Forms\Components\TagsInput::make('publishers')
                                    ->label('Publishers')
                                    ->placeholder('Add publisher...'),
                            ]),

                        Section::make('Taxonomy')
                            ->icon('heroicon-o-tag')
                            ->schema([
                                Forms\Components\TagsInput::make('genres')
                                    ->label('Genres')
                                    ->placeholder('Add genre...')
                                    ->helperText('e.g. Action, RPG, Strategy'),

                                Forms\Components\TagsInput::make('platforms')
                                    ->label('Platforms')
                                    ->placeholder('Add platform...')
                                    ->helperText('e.g. PC, PlayStation 5, Xbox Series'),

                                Forms\Components\TagsInput::make('tags')
                                    ->label('Tags')
                                    ->placeholder('Add tag...')
                                    ->helperText('Additional keywords'),
                            ]),

                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('cover_url')
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

                TextColumn::make('released')
                    ->label('Released')
                    ->date('Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('platforms')
                    ->label('Platforms')
                    ->badge()
                    ->color('info')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(),

                TextColumn::make('genres')
                    ->label('Genres')
                    ->badge()
                    ->color('gray')
                    ->separator(',')
                    ->limit(3)
                    ->toggleable(isToggledHiddenByDefault: true),

                IconColumn::make('description')
                    ->label('Desc')
                    ->state(fn ($record) => filled($record->description))
                    ->boolean()
                    ->trueIcon('heroicon-s-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                IconColumn::make('screenshots')
                    ->label('Screenshots')
                    ->state(fn ($record) => count($record->screenshots ?? []) > 0)
                    ->boolean()
                    ->trueIcon('heroicon-s-photo')
                    ->falseIcon('heroicon-o-photo')
                    ->trueColor('success')
                    ->falseColor('gray'),
            ])
            ->defaultSort('rating', 'desc')
            ->filters([
                TernaryFilter::make('description')
                    ->label('Description')
                    ->queries(
                        true: fn (Builder $q) => $q->whereNotNull('description'),
                        false: fn (Builder $q) => $q->whereNull('description'),
                    )
                    ->trueLabel('Has description')
                    ->falseLabel('Needs description')
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
