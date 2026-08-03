<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClanMissionTemplateResource\Pages;
use App\Models\ClanMissionTemplate;
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
 * Mission authoring — write a template once, every clan with a Mission
 * Control gets its own scaled instance on the next weekly spawn.
 */
class ClanMissionTemplateResource extends Resource
{
    protected static ?string $model = ClanMissionTemplate::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationLabel = 'Clan Missions';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 8;

    /** The earn vocabulary — must match config/clan.php earn reasons. */
    private const CRITERIA = [
        'review_published' => 'Review published',
        'comment_approved' => 'Quality comment',
        'list_published' => 'List published',
        'forum_solution' => 'Accepted solution',
        'thread_popular' => 'Popular thread',
        'daily_login' => 'Daily login',
        'game_completed' => 'Game completed',
        'achievement_unlocked' => 'Achievement unlocked',
        'session_logged' => 'Journal session',
        'quest_completed' => 'Quest completed',
    ];

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')->required()->maxLength(80),
                Forms\Components\Textarea::make('description')->maxLength(300)->columnSpanFull(),
                Forms\Components\Select::make('type')
                    ->options([
                        'individual' => 'Individual — everyone fills one shared bar',
                        'squad' => 'Squad — N members must each do their part',
                        'operation' => 'Operation — multi-stage with stage rewards',
                    ])
                    ->required()
                    ->live(),
                Forms\Components\Select::make('criteria_type')
                    ->label('Counts')
                    ->options(self::CRITERIA)
                    ->required(),
                Forms\Components\TextInput::make('base_target')
                    ->label('Base target (at 10 active members)')
                    ->numeric()->required()->minValue(1),
                Forms\Components\TextInput::make('per_member_target')
                    ->label('Per-member requirement (squad only)')
                    ->numeric()->minValue(1)
                    ->visible(fn ($get) => $get('type') === 'squad'),
                Forms\Components\Toggle::make('scales')
                    ->label('Scale target with active members')
                    ->default(true),
                Forms\Components\TextInput::make('duration_days')->numeric()->default(7)->minValue(1)->maxValue(35),
                Forms\Components\TextInput::make('reward_intel')->numeric()->default(0),
                Forms\Components\TextInput::make('reward_materials')->numeric()->default(0),
                Forms\Components\TextInput::make('reward_prestige')->numeric()->default(0),
                Forms\Components\Repeater::make('stages')
                    ->label('Operation stages (cumulative targets)')
                    ->schema([
                        Forms\Components\TextInput::make('target')->numeric()->required(),
                        Forms\Components\TextInput::make('intel')->numeric()->default(0),
                        Forms\Components\TextInput::make('materials')->numeric()->default(0),
                        Forms\Components\TextInput::make('prestige')->numeric()->default(0),
                    ])
                    ->columns(4)
                    ->visible(fn ($get) => $get('type') === 'operation')
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('min_mission_control')
                    ->label('Requires Mission Control level')
                    ->numeric()->default(1)->minValue(1)->maxValue(10),
                Forms\Components\Toggle::make('is_active')->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable(),
                Tables\Columns\TextColumn::make('type')->badge(),
                Tables\Columns\TextColumn::make('criteria_type')->badge(),
                Tables\Columns\TextColumn::make('base_target')->numeric()->sortable(),
                Tables\Columns\TextColumn::make('duration_days')->label('Days'),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('missions_count')->counts('missions')->label('Instances'),
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
            'index' => Pages\ListClanMissionTemplates::route('/'),
            'create' => Pages\CreateClanMissionTemplate::route('/create'),
            'edit' => Pages\EditClanMissionTemplate::route('/{record}/edit'),
        ];
    }
}
