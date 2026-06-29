<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Gta6CharacterResource\Pages;
use App\Models\Gta6Character;
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

class Gta6CharacterResource extends Resource
{
    protected static ?string $model = Gta6Character::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-user-group';

    protected static ?int $navigationSort = 11;

    public static function getNavigationGroup(): ?string
    {
        return 'GTA 6';
    }

    public static function getNavigationLabel(): string
    {
        return 'Characters';
    }

    public static function getModelLabel(): string
    {
        return 'GTA 6 Character';
    }

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
                                    ->prefix('techplay.gg/gta6/characters/')
                                    ->required()
                                    ->unique(ignoreRecord: true),

                                Forms\Components\TextInput::make('alias')
                                    ->label('Alias / nickname')
                                    ->maxLength(255),
                            ])
                            ->compact(),

                        Section::make('Description')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\Textarea::make('description')
                                    ->label('')
                                    ->rows(8)
                                    ->helperText('Write an ORIGINAL bio — do not copy from other sites.'),
                            ]),

                        Section::make('Images')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                Forms\Components\FileUpload::make('image')
                                    ->label('Main image')
                                    ->disk('public')
                                    ->directory('gta6/characters')
                                    ->image()
                                    ->imagePreviewHeight('200')
                                    ->maxSize(10240)
                                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
                                    ->nullable(),

                                Forms\Components\Repeater::make('gallery')
                                    ->label('Gallery (extra images)')
                                    ->simple(
                                        Forms\Components\FileUpload::make('url')
                                            ->disk('public')
                                            ->directory('gta6/characters/gallery')
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
                                Forms\Components\Select::make('role')
                                    ->options([
                                        'protagonist' => 'Protagonist',
                                        'antagonist'  => 'Antagonist',
                                        'supporting'  => 'Supporting',
                                    ])
                                    ->native(false),

                                Forms\Components\Select::make('status')
                                    ->options([
                                        'confirmed' => 'Confirmed',
                                        'rumored'   => 'Rumored',
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
                ImageColumn::make('image')->label('')->width(50)->height(50)->circular()->disk('public'),

                TextColumn::make('name')->searchable()->sortable()->weight('bold'),

                TextColumn::make('alias')->toggleable()->color('gray'),

                TextColumn::make('role')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'protagonist' => 'success',
                        'antagonist'  => 'danger',
                        default       => 'gray',
                    }),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'confirmed' ? 'success' : 'warning'),

                IconColumn::make('is_published')->boolean()->label('Live'),

                TextColumn::make('sort_order')->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                SelectFilter::make('role')->options([
                    'protagonist' => 'Protagonist',
                    'antagonist'  => 'Antagonist',
                    'supporting'  => 'Supporting',
                ]),
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
            'index'  => Pages\ListGta6Characters::route('/'),
            'create' => Pages\CreateGta6Character::route('/create'),
            'edit'   => Pages\EditGta6Character::route('/{record}/edit'),
        ];
    }
}
