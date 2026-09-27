<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gw2RuleResource\Pages;
use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Producers\AgonyGap;
use App\Services\Gw2\Advisor\Producers\GearGaps;
use App\Services\Gw2\Advisor\Producers\NearlyDoneAchievements;
use App\Services\Gw2\Advisor\Producers\UnclaimedAcclaim;
use App\Services\Gw2\Advisor\Producers\UnspentMasteryPoints;
use App\Services\Gw2\Advisor\Producers\VaultObjectives;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Editing what the Guild Wars 2 advisor is allowed to say.
 *
 * This screen is the entire reason the rules are a table instead of a match
 * statement, and without it the claim that "a wrong threshold is an edit, not a
 * deploy" would simply not be true.
 *
 * Two deliberate choices in the form below. `producer` is a Select over the
 * classes that exist rather than a free-text field, because a typo there costs
 * silence — the rule matches, produces nothing, and the only trace is one line in
 * the connections log. And `confidence` explains itself in the option labels,
 * since the difference between `high` and `needs_confirmation` is a claim about
 * what we know rather than about how good the advice is.
 */
class Gw2RuleResource extends Resource
{
    protected static ?string $model = Gw2Rule::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-light-bulb';

    protected static ?string $navigationLabel = 'GW2 Advisor Rules';

    protected static ?int $navigationSort = 40;

    /**
     * The producers that exist, keyed as the rule column stores them.
     *
     * Listed here rather than discovered by scanning the namespace: a producer
     * that is present but not ready to be pointed at should not appear in an
     * editor's dropdown the moment it is written.
     */
    private const PRODUCERS = [
        UnclaimedAcclaim::KEY => 'Vault — acclaim earned and not claimed',
        VaultObjectives::KEY => 'Vault — objectives still open',
        NearlyDoneAchievements::KEY => 'Achievements — close to finishing',
        UnspentMasteryPoints::KEY => 'Masteries — unspent points, per region',
        GearGaps::KEY => 'Gear — a core slot below ascended',
        AgonyGap::KEY => 'Fractals — Agony Resistance shortfall',
    ];

    private const DOMAINS = [
        'vault' => 'Wizard\'s Vault',
        'achievements' => 'Achievements',
        'masteries' => 'Masteries',
        'gear' => 'Gear',
        'fractals' => 'Fractals',
        'raids' => 'Raids',
        'wallet' => 'Currencies',
    ];

    public static function getNavigationGroup(): ?string
    {
        return 'Game Database';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\TextInput::make('key')
                ->required()
                ->maxLength(64)
                ->unique(ignoreRecord: true)
                ->helperText('Stable slug. Tests and deduplication both key on it, so renaming one is a code change too.'),

            Forms\Components\Select::make('producer')
                ->options(self::PRODUCERS)
                ->required()
                ->helperText('Which generator builds the recommendation. A name with no class behind it produces silence, not an error.'),

            Forms\Components\Select::make('domain')
                ->options(self::DOMAINS)
                ->required()
                ->helperText('Ranking draws one recommendation per domain in turn, so this decides breadth as well as labelling.'),

            Forms\Components\TextInput::make('title')
                ->required()
                ->maxLength(160)
                ->helperText('{placeholders} are filled from the signal, e.g. {name}, {region}, {slot}, {acclaim}.'),

            Forms\Components\Textarea::make('body')
                ->required()
                ->rows(3)
                ->helperText('The sentence the reader sees. A placeholder with no value behind it is left visible on purpose — a stray {count} gets reported, an empty gap does not.'),

            Forms\Components\KeyValue::make('weights')
                ->keyLabel('Fact')
                ->valueLabel('Multiplier')
                ->helperText('Added to the base score as multiplier × fact. Negative is fine: "-6" against remaining steps is how one-step-away outranks three-steps-away.')
                ->nullable(),

            Forms\Components\TextInput::make('base_score')
                ->numeric()
                ->required()
                ->minValue(0)
                ->maxValue(200),

            Forms\Components\Select::make('confidence')
                ->options([
                    'confirmed' => 'Confirmed — the API states it outright',
                    'high' => 'High — derived, but from data that cannot be read two ways',
                    'medium' => 'Medium — true, but what to do about it depends',
                    'needs_confirmation' => 'Needs confirmation — word it as a question',
                    'hidden' => 'Hidden — retired, keeps the row, stops being drawn',
                ])
                ->required()
                ->helperText('A claim about what we know, not about how good the advice is. It multiplies the score.'),

            Forms\Components\Select::make('effort_band')
                ->options([
                    'quick' => 'Quick — a few minutes',
                    'session' => 'Session — an evening',
                    'long' => 'Long — a project',
                ])
                ->nullable()
                ->helperText('Used when a player says how long they have. A rule with no band survives every time filter.'),

            Forms\Components\Select::make('needs_expansion')
                ->options([
                    'HeartOfThorns' => 'Heart of Thorns',
                    'PathOfFire' => 'Path of Fire',
                    'IcebroodSaga' => 'Icebrood Saga',
                    'EndOfDragons' => 'End of Dragons',
                    'SecretsOfTheObscure' => 'Secrets of the Obscure',
                    'JanthirWilds' => 'Janthir Wilds',
                ])
                ->nullable()
                ->helperText('Checked against what the account has demonstrably played, not against the API\'s access field — that field names the product bought, and omits Heart of Thorns for accounts that own it.'),

            Forms\Components\Toggle::make('is_active')->default(true),

            Forms\Components\DateTimePicker::make('reviewed_at')
                ->helperText('When a person last read this rule and agreed with it. Empty means nobody has.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('key')->searchable()->sortable()->limit(32),
                Tables\Columns\TextColumn::make('domain')->badge()->sortable(),
                Tables\Columns\TextColumn::make('title')->limit(48)->wrap(),
                Tables\Columns\TextColumn::make('confidence')->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'confirmed' => 'success',
                        'high' => 'info',
                        'medium' => 'warning',
                        'needs_confirmation' => 'gray',
                        default => 'danger',
                    }),
                Tables\Columns\TextColumn::make('effort_band')->label('Effort')->badge()->placeholder('any'),
                Tables\Columns\TextColumn::make('base_score')->label('Score')->sortable(),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('reviewed_at')->dateTime()->placeholder('never')->sortable(),
            ])
            ->defaultSort('base_score', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('domain')->options(self::DOMAINS),
                Tables\Filters\SelectFilter::make('confidence')->options([
                    'confirmed' => 'Confirmed',
                    'high' => 'High',
                    'medium' => 'Medium',
                    'needs_confirmation' => 'Needs confirmation',
                    'hidden' => 'Hidden',
                ]),
                Tables\Filters\TernaryFilter::make('reviewed_at')
                    ->label('Reviewed by a person')
                    ->nullable(),
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
            'index' => Pages\ListGw2Rules::route('/'),
            'create' => Pages\CreateGw2Rule::route('/create'),
            'edit' => Pages\EditGw2Rule::route('/{record}/edit'),
        ];
    }
}
