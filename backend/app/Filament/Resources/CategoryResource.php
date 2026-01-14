<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CategoryResource\Pages;
use App\Models\Category;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Illuminate\Support\Str;
use Filament\Forms\Get;
use Closure;

class CategoryResource extends Resource
{
    protected static ?string $model = Category::class;

    protected static ?string $navigationGroup = 'System';
    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    \Filament\Schemas\Components\Tabs::make('Tabs')
                        ->tabs([
                                \Filament\Schemas\Components\Tabs\Tab::make('Content')
                                    ->icon('heroicon-o-document-text')
                                    ->schema([
                                            Forms\Components\TextInput::make('name')
                                                ->required()
                                                ->maxLength(255)
                                                ->live(onBlur: true)
                                                ->afterStateUpdated(function (Closure $set, ?string $state) {
                                                    $set('slug', Str::slug($state));
                                                }),
                                            Forms\Components\TextInput::make('slug')
                                                ->required()
                                                ->maxLength(255)
                                                ->unique(ignoreRecord: true),
                                            Forms\Components\Select::make('type')
                                                ->options([
                                                        'news' => 'News',
                                                        'reviews' => 'Reviews',
                                                        'tech' => 'Tech/Hardware',
                                                        'forum' => 'Forum',
                                                    ])
                                                ->required()
                                                ->live(),
                                            Forms\Components\Select::make('parent_id')
                                                ->label('Parent Category')
                                                ->relationship('parent', 'name', function ($query) {
                                                    // Only show categories that are NOT children themselves (max depth 1 for now)
                                                    return $query->whereNull('parent_id');
                                                })
                                                ->searchable()
                                                ->preload()
                                                ->nullable()
                                                // If type is forum, we might want to restrict parents to forum type too, but let's keep it flexible for now or filter in query
                                                ->visible(fn(Forms\Get $get) => $get('type') === 'forum'),
                                            Forms\Components\TextInput::make('icon')
                                                ->placeholder('heroicon-o-chat-bubble-left')
                                                ->maxLength(255),
                                            Forms\Components\Textarea::make('description')
                                                ->rows(3),
                                        ]),
                                \App\Filament\Components\SeoForm::make(),
                            ])->columnSpanFull(),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('name')
                        ->searchable()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('slug'),
                    Tables\Columns\TextColumn::make('type')
                        ->badge()
                        ->color(fn(string $state): string => match ($state) {
                            'news' => 'info',
                            'reviews' => 'success',
                            'tech' => 'warning',
                            'forum' => 'danger',
                            default => 'gray',
                        }),
                    Tables\Columns\TextColumn::make('parent.name')
                        ->label('Parent')
                        ->placeholder('-'),
                    Tables\Columns\TextColumn::make('articles_count')
                        ->counts('articles')
                        ->label('Articles'),
                ])
            ->filters([
                    Tables\Filters\SelectFilter::make('type')
                        ->options([
                                'news' => 'News',
                                'reviews' => 'Reviews',
                                'tech' => 'Tech/Hardware',
                                'forum' => 'Forum',
                            ]),
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

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCategories::route('/'),
            'create' => Pages\CreateCategory::route('/create'),
            'edit' => Pages\EditCategory::route('/{record}/edit'),
        ];
    }
}
