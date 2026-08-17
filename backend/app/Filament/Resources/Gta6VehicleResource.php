<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Resources\Gta6VehicleResource\Pages;
use App\Models\Gta6Vehicle;
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

class Gta6VehicleResource extends Resource
{
    protected static ?string $model = Gta6Vehicle::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-truck';

    protected static ?int $navigationSort = 20;

    public static function getNavigationGroup(): ?string
    {
        return 'GTA 6';
    }

    public static function getNavigationLabel(): string
    {
        return 'Vehicles';
    }

    public static function getModelLabel(): string
    {
        return 'GTA 6 Vehicle';
    }

    private const CLASSES = [
        'Super' => 'Super',
        'Sports' => 'Sports',
        'Sedan' => 'Sedan',
        'Coupe' => 'Coupe',
        'SUV' => 'SUV',
        'Muscle' => 'Muscle',
        'Off-Road' => 'Off-Road',
        'Motorcycle' => 'Motorcycle',
        'Boat' => 'Boat',
        'Aircraft' => 'Aircraft',
        'Helicopter' => 'Helicopter',
        'Commercial' => 'Commercial',
        'Emergency' => 'Emergency',
        'Utility' => 'Utility',
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
                                    ->prefix('techplay.gg/gta6/vehicles/')
                                    ->required()
                                    ->unique(ignoreRecord: true),

                                Forms\Components\TextInput::make('real_equivalent')
                                    ->label('Real-world inspiration')
                                    ->maxLength(255)
                                    ->placeholder('e.g. Ferrari 812 Superfast'),
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
                                ...MediaPickerFields::make('image', null, 'gta6-vehicles'),

                                Forms\Components\Repeater::make('gallery')
                                    ->label('Gallery (extra images)')
                                    ->simple(
                                        Forms\Components\FileUpload::make('url')
                                            ->disk('public')
                                            ->directory('gta6-vehicles/gallery')
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
                                Forms\Components\Select::make('vehicle_class')
                                    ->label('Class')
                                    ->options(self::CLASSES)
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

                TextColumn::make('vehicle_class')->badge()->color('info')->sortable(),

                TextColumn::make('real_equivalent')->toggleable()->color('gray')->limit(30),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'confirmed' ? 'success' : 'warning'),

                IconColumn::make('is_published')->boolean()->label('Live'),
            ])
            ->defaultSort('sort_order')
            ->filters([
                SelectFilter::make('vehicle_class')->options(self::CLASSES),
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
            'index' => Pages\ListGta6Vehicles::route('/'),
            'create' => Pages\CreateGta6Vehicle::route('/create'),
            'edit' => Pages\EditGta6Vehicle::route('/{record}/edit'),
        ];
    }
}
