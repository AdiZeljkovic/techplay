<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GiveawayResource\Pages;
use App\Models\Giveaway;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Schemas\Components\{Section, Grid, Tabs};
use Filament\Forms\Components\{TextInput, Textarea, RichEditor, Select, Toggle, DateTimePicker, FileUpload, Repeater, Placeholder};
use Filament\Tables\Columns\{TextColumn, ImageColumn};
use Filament\Tables\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Support\Str;

class GiveawayResource extends Resource
{
    protected static ?string $model = Giveaway::class;
    protected static ?string $navigationIcon = 'heroicon-o-gift';
    protected static ?int $navigationSort = 50;

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Tabs::make('Giveaway')
                ->tabs([
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Basic Info')
                        ->icon('heroicon-o-information-circle')
                        ->schema([
                            Section::make('Giveaway Details')
                                ->schema([
                                    TextInput::make('title')
                                        ->required()
                                        ->maxLength(100)
                                        ->live(onBlur: true)
                                        ->afterStateUpdated(fn($state, $set) => $set('slug', Str::slug($state) . '-' . Str::random(6))),

                                    TextInput::make('slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->prefix('techplay.gg/giveaway/')
                                        ->helperText('Unique link for this giveaway'),

                                    RichEditor::make('description')
                                        ->label('Description')
                                        ->placeholder('Describe the giveaway...')
                                        ->columnSpanFull(),

                                    Textarea::make('rules')
                                        ->label('Rules & Terms')
                                        ->placeholder('Enter the official rules...')
                                        ->rows(4)
                                        ->columnSpanFull(),
                                ]),

                            Section::make('Featured Image')
                                ->schema([
                                    FileUpload::make('featured_image')
                                        ->label('')
                                        ->image()
                                        ->directory('giveaways')
                                        ->imageEditor()
                                        ->columnSpanFull(),
                                ])
                                ->collapsible(),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: PRIZE
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Prize')
                        ->icon('heroicon-o-trophy')
                        ->schema([
                            Section::make('Prize Information')
                                ->schema([
                                    Grid::make(2)->schema([
                                        TextInput::make('prize_name')
                                            ->required()
                                            ->placeholder('e.g. Gaming PC, PS5, Steam Gift Card'),

                                        TextInput::make('prize_value')
                                            ->numeric()
                                            ->prefix('€')
                                            ->placeholder('500.00'),
                                    ]),

                                    FileUpload::make('prize_image')
                                        ->label('Prize Image')
                                        ->image()
                                        ->directory('giveaways/prizes')
                                        ->imageEditor(),
                                ]),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: TASKS
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Tasks')
                        ->icon('heroicon-o-clipboard-document-check')
                        ->schema([
                            Section::make('Entry Tasks')
                                ->description('Define tasks users can complete to earn points')
                                ->schema([
                                    Repeater::make('tasks')
                                        ->relationship()
                                        ->schema([
                                            Grid::make(3)->schema([
                                                Select::make('type')
                                                    ->options([
                                                        'facebook_like' => '👍 Like Facebook Page',
                                                        'facebook_share' => '📢 Share on Facebook',
                                                        'instagram_follow' => '📷 Follow on Instagram',
                                                        'youtube_subscribe' => '▶️ Subscribe on YouTube',
                                                        'twitter_follow' => '🐦 Follow on Twitter/X',
                                                        'twitter_retweet' => '🔁 Retweet',
                                                        'discord_join' => '💬 Join Discord',
                                                        'visit_url' => '🔗 Visit URL',
                                                        'share_giveaway' => '📤 Share Giveaway',
                                                        'daily_visit' => '📅 Daily Visit',
                                                        'referral' => '👥 Refer a Friend',
                                                        'custom' => '⭐ Custom Task',
                                                    ])
                                                    ->required()
                                                    ->live(),

                                                TextInput::make('title')
                                                    ->required()
                                                    ->placeholder('Task title'),

                                                TextInput::make('points')
                                                    ->numeric()
                                                    ->required()
                                                    ->default(1)
                                                    ->minValue(1)
                                                    ->maxValue(100),
                                            ]),

                                            Grid::make(2)->schema([
                                                TextInput::make('url')
                                                    ->url()
                                                    ->placeholder('https://...')
                                                    ->helperText('Link to complete task'),

                                                TextInput::make('description')
                                                    ->placeholder('Optional instructions'),
                                            ]),

                                            Grid::make(3)->schema([
                                                Toggle::make('is_required')
                                                    ->label('Required')
                                                    ->helperText('Must complete to enter'),

                                                Toggle::make('is_repeatable')
                                                    ->label('Daily Task')
                                                    ->helperText('Can complete once per day'),

                                                TextInput::make('sort_order')
                                                    ->numeric()
                                                    ->default(0)
                                                    ->label('Order'),
                                            ]),
                                        ])
                                        ->defaultItems(0)
                                        ->reorderable()
                                        ->collapsible()
                                        ->itemLabel(fn(array $state): ?string =>
                                            ($state['title'] ?? 'New Task') . ' (+' . ($state['points'] ?? 0) . ' pts)')
                                        ->addActionLabel('Add Task'),
                                ]),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: SCHEDULE
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Schedule')
                        ->icon('heroicon-o-clock')
                        ->schema([
                            Section::make('Timing')
                                ->schema([
                                    Grid::make(2)->schema([
                                        DateTimePicker::make('starts_at')
                                            ->label('Start Date')
                                            ->required()
                                            ->native(false)
                                            ->default(now()),

                                        DateTimePicker::make('ends_at')
                                            ->label('End Date')
                                            ->required()
                                            ->native(false)
                                            ->after('starts_at'),
                                    ]),

                                    Grid::make(2)->schema([
                                        Select::make('status')
                                            ->options([
                                                'draft' => '📝 Draft',
                                                'active' => '🟢 Active',
                                                'ended' => '🏁 Ended',
                                                'cancelled' => '❌ Cancelled',
                                            ])
                                            ->default('draft')
                                            ->required(),

                                        TextInput::make('max_entries_per_user')
                                            ->label('Max Points Per User')
                                            ->numeric()
                                            ->default(100)
                                            ->helperText('Prevents abuse'),
                                    ]),

                                    Toggle::make('is_public')
                                        ->label('Publicly Accessible')
                                        ->default(true)
                                        ->helperText('Anyone with the link can view'),
                                ]),
                        ]),
                ])
                ->columnSpanFull(),

            Forms\Components\Hidden::make('created_by')
                ->default(fn() => auth()->id()),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('featured_image')
                    ->label('')
                    ->circular()
                    ->size(40),

                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->description(fn(Giveaway $record) => $record->prize_name),

                TextColumn::make('entries_count')
                    ->label('Entries')
                    ->counts('entries')
                    ->badge()
                    ->color('info'),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'draft' => 'gray',
                        'active' => 'success',
                        'ended' => 'warning',
                        'cancelled' => 'danger',
                        default => 'gray',
                    }),

                TextColumn::make('ends_at')
                    ->label('Ends')
                    ->dateTime('M j, Y')
                    ->sortable(),

                TextColumn::make('winner.username')
                    ->label('Winner')
                    ->placeholder('—'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'active' => 'Active',
                        'ended' => 'Ended',
                        'cancelled' => 'Cancelled',
                    ]),
            ])
            ->actions([
                Action::make('copyLink')
                    ->label('Copy Link')
                    ->icon('heroicon-o-link')
                    ->action(function (Giveaway $record) {
                        // JS will handle clipboard
                    })
                    ->extraAttributes(fn(Giveaway $record) => [
                        'x-on:click' => "navigator.clipboard.writeText('" . $record->getPublicUrl() . "'); \$tooltip('Copied!')",
                    ]),

                Action::make('pickWinner')
                    ->label('Pick Winner')
                    ->icon('heroicon-o-trophy')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Pick a Winner')
                    ->modalDescription('This will randomly select a winner based on point weights. This action cannot be undone.')
                    ->visible(fn(Giveaway $record) => $record->hasEnded() && !$record->winner_id)
                    ->action(function (Giveaway $record) {
                        $winner = $record->pickWinner();
                        if ($winner) {
                            Notification::make()
                                ->title('Winner Selected!')
                                ->body("🎉 {$winner->username} has won!")
                                ->success()
                                ->send();
                        } else {
                            Notification::make()
                                ->title('No Entries')
                                ->body('No valid entries to pick from.')
                                ->warning()
                                ->send();
                        }
                    }),

                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGiveaways::route('/'),
            'create' => Pages\CreateGiveaway::route('/create'),
            'edit' => Pages\EditGiveaway::route('/{record}/edit'),
        ];
    }
}
