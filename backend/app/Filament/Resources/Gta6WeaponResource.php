<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Resources\Gta6WeaponResource\Pages;
use App\Models\Gta6Weapon;
use Filament\Actions\BulkActionGroup;
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
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class Gta6WeaponResource extends Resource
{
    protected static ?string $model = Gta6Weapon::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-bolt';

    protected static ?int $navigationSort = 30;

    public static function getNavigationGroup(): ?string
    {
        return 'GTA 6';
    }

    public static function getNavigationLabel(): string
    {
        return 'Weapons';
    }

    public static function getModelLabel(): string
    {
        return 'GTA 6 Weapon';
    }

    private const TYPES = [
        'Pistol' => 'Pistol',
        'SMG' => 'SMG',
        'Rifle' => 'Rifle',
        'Shotgun' => 'Shotgun',
        'Sniper' => 'Sniper',
        'Heavy' => 'Heavy',
        'Explosive' => 'Explosive',
        'Melee' => 'Melee',
        'Thrown' => 'Thrown',
    ];

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3])
            ->components([
                Group::make()
                    ->schema([
                        Section::make()
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->required()
                                    ->maxLength(255)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state))),

                                Forms\Components\TextInput::make('slug')
                                    ->prefix('techplay.gg/gta6/weapons/')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                            ])
                            ->compact(),

                        Section::make('Description')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\Textarea::make('description')
                                    ->label('')
                                    ->rows(8)
                                    ->helperText('Write an ORIGINAL description.'),
                            ]),

                        Section::make('Images')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                ...MediaPickerFields::make('image', null, 'gta6-weapons'),

                                Forms\Components\Repeater::make('gallery')
                                    ->label('Gallery (extra images)')
                                    ->simple(
                                        Forms\Components\FileUpload::make('url')
                                            ->disk('public')
                                            ->directory('gta6-weapons/gallery')
                                            ->image()
                                            ->maxSize(10240)
                                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
                                    )
                                    ->addActionLabel('Add image')
                                    ->defaultItems(0)
                                    ->reorderable()
                                    ->collapsed(),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Details')
                            ->icon('heroicon-o-information-circle')
                            ->schema([
                                Forms\Components\Select::make('weapon_type')
                                    ->label('Type')
                                    ->options(self::TYPES)
                                    ->searchable()
                                    ->native(false),

                                Forms\Components\Select::make('status')
                                    ->options([
                                        'confirmed' => 'Confirmed',
                                        'rumored' => 'Rumored',
                                    ])
                                    ->default('confirmed')
                                    ->native(false),

                                Forms\Components\Toggle::make('is_published')
                                    ->label('Published')
                                    ->default(true),

                                Forms\Components\TextInput::make('sort_order')
                                    ->numeric()
                                    ->default(0)
                                    ->helperText('Lower = shown first'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image')->label('')->width(64)->height(40)->disk('public'),

                TextColumn::make('name')->searchable()->sortable()->weight('bold'),

                TextColumn::make('weapon_type')->badge()->color('info')->sortable(),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'confirmed' ? 'success' : 'warning'),

                IconColumn::make('is_published')->boolean()->label('Live'),
            ])
            ->defaultSort('sort_order')
            ->filters([
                SelectFilter::make('weapon_type')->options(self::TYPES),
                TernaryFilter::make('is_published')->label('Published'),
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
            'index' => Pages\ListGta6Weapons::route('/'),
            'create' => Pages\CreateGta6Weapon::route('/create'),
            'edit' => Pages\EditGta6Weapon::route('/{record}/edit'),
        ];
    }
}
