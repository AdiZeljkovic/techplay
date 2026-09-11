<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GiveawayResource\Pages;
use App\Models\Giveaway;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class GiveawayResource extends Resource
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
     * Filament's default is 50 per resource, and with 332,455 games in the
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
        return array_filter(['Status' => $record->status]);
    }

    protected static ?string $model = Giveaway::class;

    protected static ?int $navigationSort = 10;

    public static function getNavigationGroup(): ?string
    {
        return 'Shop & Monetization';
    }

    public static function getNavigationIcon(): string
    {
        return 'heroicon-o-gift';
    }

    /**
     * How many giveaways have finished without anyone drawing a winner.
     *
     * Drawing is a manual action in this panel and nothing anywhere reminds
     * staff to do it — a giveaway whose end date passed simply sat there, prize
     * unawarded, entrants waiting, and the only way to notice was to go looking.
     */
    /**
     * Draws that are over and were never made.
     *
     * The first version of this asked for `winner_id IS NULL AND ends_at <
     * NOW() AND status != 'ended'`, and the last clause excluded exactly the
     * case it was built to catch: a giveaway an editor had closed without
     * drawing. The World of Tanks draw sat like that for 207 days with 18
     * people waiting, and this badge was empty the whole time.
     *
     * `winner_announced_at` rather than `winner_id`, because a tiered draw
     * writes winners into the tiers and leaves `winner_id` null — so the old
     * column would have made every properly finished multi-prize giveaway
     * badge forever.
     *
     * And `whereHas('entries')`, because a giveaway nobody entered has nothing
     * to draw. Without it the badge would name a giveaway that can never be
     * resolved, and a warning that cannot be cleared is one people learn to
     * ignore — which is how the first one was missed.
     */
    public static function getNavigationBadge(): ?string
    {
        $awaiting = self::unfinishedDraws()->count();

        return $awaiting > 0 ? (string) $awaiting : null;
    }

    /** Shared with `giveaways:unfinished`, so the badge and the alarm agree. */
    public static function unfinishedDraws(): Builder
    {
        return Giveaway::query()
            ->whereNull('winner_announced_at')
            ->where('ends_at', '<', now())
            ->whereHas('entries');
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function getNavigationLabel(): string
    {
        return 'Giveaways';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Tabs::make('Giveaway')
                ->tabs([
                    Tabs\Tab::make('Basic Info')
                        ->icon('heroicon-o-information-circle')
                        ->schema([
                            Section::make()
                                ->schema([
                                    TextInput::make('title')
                                        ->required()
                                        ->maxLength(100)
                                        ->live(onBlur: true)
                                        ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state).'-'.Str::random(6))),

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
                                        ->maxSize(5120)
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
                            Section::make()
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
                                        ->maxSize(5120),
                                ]),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: PRIZE TIERS (Optional Multi-Winner System)
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Prize Tiers')
                        ->icon('heroicon-o-star')
                        ->schema([
                            Section::make()
                                ->description('Define prize tiers with multiple winners (e.g., Gold/Silver/Bronze). Leave empty for single-winner mode.')
                                ->schema([
                                    Repeater::make('prizeTiers')
                                        ->relationship()
                                        ->schema([
                                            Grid::make(3)->schema([
                                                TextInput::make('tier_name')
                                                    ->required()
                                                    ->placeholder('e.g. Grand Prize, Silver, Bronze')
                                                    ->label('Tier Name'),

                                                TextInput::make('winner_count')
                                                    ->numeric()
                                                    ->required()
                                                    ->default(1)
                                                    ->minValue(1)
                                                    ->label('# of Winners'),

                                                TextInput::make('min_points')
                                                    ->numeric()
                                                    ->default(0)
                                                    ->helperText('Min points to qualify')
                                                    ->label('Min Points'),
                                            ]),

                                            Textarea::make('prize_description')
                                                ->label('Prize Description')
                                                ->placeholder('Describe this tier\'s prize...')
                                                ->rows(2)
                                                ->columnSpanFull(),

                                            TextInput::make('sort_order')
                                                ->numeric()
                                                ->default(0)
                                                ->label('Display Order')
                                                ->helperText('Lower = higher tier'),
                                        ])
                                        ->defaultItems(0)
                                        ->reorderable()
                                        ->collapsible()
                                        ->itemLabel(fn (array $state): ?string => ($state['tier_name'] ?? 'New Tier').' ('.($state['winner_count'] ?? 1).' winner'.(($state['winner_count'] ?? 1) > 1 ? 's' : '').')')
                                        ->addActionLabel('Add Prize Tier'),
                                ]),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: TASKS
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Tasks')
                        ->icon('heroicon-o-clipboard-document-check')
                        ->schema([
                            Section::make()
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
                                                        'forum_post' => '💬 Post in the Forum',
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
                                        ->itemLabel(fn (array $state): ?string => ($state['title'] ?? 'New Task').' (+'.($state['points'] ?? 0).' pts)')
                                        ->addActionLabel('Add Task'),
                                ]),
                        ]),

                    // ═══════════════════════════════════════════════════════════
                    // TAB: SCHEDULE
                    // ═══════════════════════════════════════════════════════════
                    Tabs\Tab::make('Schedule')
                        ->icon('heroicon-o-clock')
                        ->schema([
                            Section::make()
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

                                    /*
                                     * The four the hub filters by.
                                     *
                                     * The columns have existed since 5 August
                                     * 2026 and the public page has offered
                                     * them as a filter row ever since, with
                                     * counts beside each option. Nothing in
                                     * this form could set them, so both
                                     * existing giveaways carry null in all
                                     * four and the row has never had anything
                                     * to show.
                                     *
                                     * The values are not free text: the hub
                                     * maps each one to a label, and a value it
                                     * does not know renders as its own raw
                                     * key. Selects, so that cannot happen.
                                     */
                                    Grid::make(2)->schema([
                                        Select::make('platform')
                                            ->label('Platform')
                                            ->options([
                                                'pc' => 'PC',
                                                'playstation' => 'PlayStation',
                                                'xbox' => 'Xbox',
                                                'nintendo' => 'Nintendo',
                                                'multi' => 'Multi-platform',
                                            ])
                                            ->helperText('Filters the giveaway hub. Leave empty if it does not apply.'),

                                        Select::make('prize_type')
                                            ->label('Prize type')
                                            ->options([
                                                'hardware' => 'Hardware',
                                                'game_key' => 'Game keys',
                                                'gift_card' => 'Gift cards',
                                                'subscription' => 'Subscriptions',
                                                'merch' => 'Merch',
                                                'bundle' => 'Bundles',
                                            ]),
                                    ]),

                                    Grid::make(2)->schema([
                                        Select::make('region')
                                            ->label('Region')
                                            ->options([
                                                'worldwide' => 'Worldwide',
                                                'eu' => 'Europe',
                                                'ba' => 'Bosnia',
                                                'na' => 'North America',
                                            ])
                                            ->helperText('Where the prize can actually be claimed.'),

                                        Select::make('entry_type')
                                            ->label('Entry type')
                                            ->options([
                                                'free' => 'Free entry',
                                                'members' => 'Members only',
                                                'tasks' => 'Task based',
                                            ]),
                                    ]),

                                    Toggle::make('is_public')
                                        ->label('Publicly accessible')
                                        ->default(true)
                                        ->helperText('Anyone with the link can view'),

                                ]),
                        ]),
                ])
                ->columnSpanFull(),

            Forms\Components\Hidden::make('created_by')
                ->default(fn () => auth()->id()),
        ]);
    }

    /**
     * Eager load the winner the table shows.
     *
     * Two rows today, so two extra queries — but the table draws
     * `winner.username` and nothing loaded it, and a giveaway list grows the
     * way giveaways do.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with('winner:id,username');
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
                    ->description(fn (Giveaway $record) => $record->prize_name),

                TextColumn::make('entries_count')
                    ->label('Entries')
                    ->counts('entries')
                    ->badge()
                    ->color('info'),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
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
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'active' => 'Active',
                        'ended' => 'Ended',
                        'cancelled' => 'Cancelled',
                    ]),
            ])
            ->actions([
                /*
                 * Both of these build the public address through the model.
                 *
                 * "View on site" used to assemble its own — config('app.site_url')
                 * . '/giveaways/' . slug — with the listing's plural, and
                 * /giveaways/{slug} is not a route: every use of this button
                 * opened a 404. It showed up in our own analytics as four hits
                 * on a path that does not exist, which read like somebody had
                 * posted a bad link somewhere. It was this button.
                 *
                 * getPublicUrl() is the one place that knows the shape, and it
                 * is also what the referral links are built from — so a URL
                 * written out by hand beside it is a second answer to a question
                 * that should only have one.
                 */
                Action::make('onSite')
                    ->label('View on site')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->url(fn (Giveaway $record): string => $record->getPublicUrl(), shouldOpenInNewTab: true)
                    ->visible(fn ($record): bool => filled($record->slug)),

                Action::make('copyLink')
                    ->label('Copy Link')
                    ->icon('heroicon-o-link')
                    // The same confirmation the edit screen uses, which works.
                    // This one called $tooltip(), an Alpine magic that is not
                    // there — the click threw, so the clipboard write never ran
                    // and the button looked like it had copied the wrong thing
                    // when it had copied nothing at all.
                    ->action(fn (Giveaway $record) => Notification::make()
                        ->title('Link copied')
                        ->body($record->getPublicUrl())
                        ->success()
                        ->send())
                    ->extraAttributes(fn (Giveaway $record) => [
                        // json_encode, not quotes glued together: a slug is
                        // editor input and one apostrophe in it would break the
                        // attribute and take the row's buttons with it.
                        'x-on:click' => 'navigator.clipboard.writeText('.json_encode($record->getPublicUrl()).')',
                    ]),

                Action::make('viewParticipants')
                    ->label('View Participants')
                    ->icon('heroicon-o-users')
                    ->color('info')
                    ->modalHeading('Giveaway Participants')
                    ->modalDescription(fn (Giveaway $record) => 'Total participants: '.$record->entries()->where('total_points', '>', 0)->count().' | Total points pool: '.number_format($record->getTotalEntryPool()))
                    ->modalContent(fn (Giveaway $record) => view('filament.resources.giveaway.modals.participants-list', [
                        'entries' => $record->entries()
                            ->with('user')
                            ->where('total_points', '>', 0)
                            ->orderBy('total_points', 'desc')
                            ->get(),
                        'totalPool' => $record->getTotalEntryPool(),
                    ]))
                    ->modalWidth('7xl')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->visible(fn (Giveaway $record) => $record->entries()->where('total_points', '>', 0)->count() > 0),

                Action::make('pickWinner')
                    ->label('Auto Pick Winner')
                    ->icon('heroicon-o-trophy')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Auto Pick a Winner')
                    ->modalDescription('This will automatically select a winner using weighted random algorithm based on points. This action cannot be undone.')
                    ->modalWidth('md')
                    ->visible(fn (Giveaway $record) => $record->hasEnded() && ! $record->winner_id && ! $record->hasTiers())
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

                Action::make('manualWinner')
                    ->label('Manual Winner')
                    ->icon('heroicon-o-hand-raised')
                    ->color('warning')
                    ->form([
                        Select::make('winner_id')
                            ->label('Select Winner')
                            ->options(function (Giveaway $record) {
                                return $record->entries()
                                    ->with('user')
                                    ->where('total_points', '>', 0)
                                    ->get()
                                    ->mapWithKeys(function ($entry) {
                                        $user = $entry->user;

                                        return [
                                            $user->id => "{$user->username} ({$user->email}) - {$entry->total_points} points",
                                        ];
                                    });
                            })
                            ->searchable()
                            ->required()
                            ->helperText('You will need to manually send them an email.'),
                    ])
                    ->visible(fn (Giveaway $record) => $record->hasEnded() && ! $record->winner_id && ! $record->hasTiers())
                    ->action(function (Giveaway $record, array $data) {
                        $record->update([
                            'winner_id' => $data['winner_id'],
                            'status' => 'ended',
                            'winner_announced_at' => now(),
                        ]);

                        $winner = User::find($data['winner_id']);
                        Notification::make()
                            ->title('Winner Set!')
                            ->body("✅ {$winner->username} ({$winner->email}) marked as winner. Please send them an email manually.")
                            ->success()
                            ->send();
                    }),

                Action::make('pickWinnersByTiers')
                    ->label('Pick Winners (Tiers)')
                    ->icon('heroicon-o-star')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Pick Winners by Prize Tiers')
                    ->modalDescription('This will select multiple winners for each prize tier. Winners are selected using weighted random. This action cannot be undone.')
                    ->visible(fn (Giveaway $record) => $record->hasEnded() && $record->hasTiers())
                    ->action(function (Giveaway $record) {
                        $results = $record->pickWinnersByTiers();

                        if (empty($results)) {
                            Notification::make()
                                ->title('No Winners Selected')
                                ->body('No entries qualified for any tier.')
                                ->warning()
                                ->send();

                            return;
                        }

                        $totalWinners = array_sum(array_map('count', $results));
                        $message = "🎉 Selected {$totalWinners} winner".($totalWinners > 1 ? 's' : '').' across '.count($results).' tier'.(count($results) > 1 ? 's' : '').'!';

                        Notification::make()
                            ->title('Winners Selected!')
                            ->body($message)
                            ->success()
                            ->send();
                    }),

                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
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
