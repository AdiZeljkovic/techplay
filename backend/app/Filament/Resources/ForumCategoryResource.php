<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ForumCategoryResource\Pages;
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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Filament\Forms\Get;
use Closure;

class ForumCategoryResource extends Resource
{
    protected static ?string $model = Category::class;

    public static function getNavigationGroup(): ?string
    {
        return 'Community Hub';
    }
    protected static ?int $navigationSort = 5;

    protected static ?string $navigationLabel = 'Categories'; // Shows as "Categories" under Community

    protected static ?string $slug = 'forum-categories'; // Unique URL

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('type', 'forum');
    }

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

                                            Forms\Components\Hidden::make('type')
                                                ->default('forum'),

                                            Forms\Components\Select::make('parent_id')
                                                ->label('Parent Category')
                                                ->relationship('parent', 'name', function ($query) {
                                                    return $query->whereNull('parent_id')->where('type', 'forum');
                                                })
                                                ->searchable()
                                                ->preload()
                                                ->nullable(),

                                            Forms\Components\TextInput::make('icon')
                                                ->placeholder('heroicon-o-chat-bubble-left')
                                                ->maxLength(255),
                                            Forms\Components\Textarea::make('description')
                                                ->rows(3),
                                        ]),
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
                    Tables\Columns\TextColumn::make('parent.name')
                        ->label('Parent')
                        ->placeholder('Root Category'),
                    Tables\Columns\TextColumn::make('threads_count')
                        ->counts('threads')
                        ->label('Threads'),
                ])
            ->filters([
                    //
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
            'index' => Pages\ListForumCategories::route('/'),
            'create' => Pages\CreateForumCategory::route('/create'),
            'edit' => Pages\EditForumCategory::route('/{record}/edit'),
        ];
    }
}
