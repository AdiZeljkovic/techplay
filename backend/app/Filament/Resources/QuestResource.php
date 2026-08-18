<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuestResource\Pages;
use App\Models\Quest;
use App\Models\Season;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Quests, which until now existed only as two seeder files.
 *
 * The criteria list below is not a guess: it is every string the application
 * actually passes to QuestService::progress(). A quest with a criteria type
 * outside this list can be created and displayed and will never once advance,
 * which is why this is a Select and not a text field.
 */
class QuestResource extends Resource
{
    protected static ?string $model = Quest::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-map';

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
        return parent::getEloquentQuery()->with(['season']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Gamification';
    }

    protected static ?int $navigationSort = 40;

    /** Every criteria the code emits, and what triggers it. */
    private const CRITERIA = [
        'game_added' => 'Game added to a collection',
        'game_completed' => 'Game marked completed',
        'game_rated' => 'Game rated',
        'list_published' => 'Game list published',
        'comment_posted' => 'Comment posted',
        'forum_post' => 'Forum reply posted',
        'thread_started' => 'Forum thread started',
        'friend_made' => 'Friend request accepted',
        'article_published' => 'Article published',
        'review_published' => 'Review published',
        'session_logged' => 'Play session logged',
        'daily_login' => 'Daily login (streak)',
        'streak_days' => 'Streak length reached',
    ];

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('type')
                    ->required()
                    ->default('permanent')
                    ->options([
                        'daily' => 'Daily',
                        'weekly' => 'Weekly',
                        'monthly' => 'Monthly',
                        'permanent' => 'Permanent',
                    ]),

                // NOT NULL in the schema — without this the form saves and the
                // database refuses, which reads to the user as a broken panel.
                Forms\Components\Textarea::make('description')
                    ->required()
                    ->rows(2)
                    ->columnSpanFull(),

                Forms\Components\Select::make('criteria_type')
                    ->label('Completed by')
                    ->required()
                    ->options(self::CRITERIA)
                    ->helperText('Only these advance — they are the events the site actually reports.'),

                Forms\Components\TextInput::make('criteria_value')
                    ->label('How many')
                    ->required()
                    ->numeric()
                    ->default(1)
                    ->minValue(1),

                Forms\Components\TextInput::make('xp_reward')
                    ->required()
                    ->numeric()
                    ->default(0)
                    ->minValue(0),

                Forms\Components\TextInput::make('bounty_reward')
                    ->required()
                    ->numeric()
                    ->default(0)
                    ->minValue(0),

                Forms\Components\Select::make('season_id')
                    ->label('Season')
                    ->relationship('season', 'name')
                    ->searchable()
                    ->preload()
                    ->helperText('Leave empty for a quest that runs regardless of season.'),

                Forms\Components\TextInput::make('icon')
                    ->maxLength(255)
                    ->helperText('Heroicon name, e.g. heroicon-o-trophy.'),

                Forms\Components\DateTimePicker::make('expires_at')
                    ->helperText('Optional hard stop, independent of the season.'),

                Forms\Components\Toggle::make('is_active')
                    ->default(true)
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->description(fn (Quest $record) => self::CRITERIA[$record->criteria_type] ?? $record->criteria_type),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (?string $state) => $state === 'permanent' ? 'gray' : 'info'),

                Tables\Columns\TextColumn::make('criteria_value')->label('Target')->numeric()->sortable(),
                Tables\Columns\TextColumn::make('xp_reward')->label('XP')->numeric()->sortable(),
                Tables\Columns\TextColumn::make('bounty_reward')->label('Bounty')->numeric()->sortable(),

                Tables\Columns\TextColumn::make('season.name')
                    ->label('Season')
                    ->placeholder('Any season')
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_active')->boolean(),
            ])
            // Newest first: without a default sort the list came back in
            // insertion order, so a quest you just created landed on page
            // three behind two dozen seeded ones.
            ->defaultSort('id', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('season_id')
                    ->label('Season')
                    ->options(fn () => Season::orderByDesc('start_date')->pluck('name', 'id')->all()),
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'daily' => 'Daily',
                        'weekly' => 'Weekly',
                        'monthly' => 'Monthly',
                        'permanent' => 'Permanent',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active'),
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

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuests::route('/'),
            'create' => Pages\CreateQuest::route('/create'),
            'edit' => Pages\EditQuest::route('/{record}/edit'),
        ];
    }
}
