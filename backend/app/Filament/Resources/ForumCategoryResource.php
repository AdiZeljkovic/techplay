<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ForumCategoryResource\Pages;
use App\Models\Category;
use Closure;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ForumCategoryResource extends Resource
{
    protected static ?string $model = Category::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-chat-bubble-bottom-center-text';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 20;

    protected static ?string $navigationLabel = 'Forum Categories';

    protected static ?string $slug = 'forum-categories'; // Unique URL

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            // Filament does not eager load relationship columns by itself.
            ->with(['parent'])->where('type', 'forum');
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Tabs')
                    ->tabs([
                        Tab::make('Content')
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

                                Forms\Components\Select::make('visibility')
                                    ->label('Who can see this board')
                                    ->options([
                                        Category::VISIBILITY_PUBLIC => 'Everyone, including search engines',
                                        Category::VISIBILITY_MEMBERS => 'Signed-in members only',
                                        Category::VISIBILITY_STAFF => 'Forum staff only',
                                    ])
                                    ->default(Category::VISIBILITY_PUBLIC)
                                    ->required()
                                    // Worth stating plainly on the form: a
                                    // private board is filtered out of the
                                    // index rather than shown locked, because a
                                    // lock is itself information.
                                    ->helperText('A non-public board is hidden entirely from anyone without access — it does not appear in the board list, in search, or through a direct link.'),

                                Forms\Components\TextInput::make('icon')
                                    ->placeholder('heroicon-o-chat-bubble-left')
                                    ->maxLength(255),
                                Forms\Components\Textarea::make('description')
                                    ->rows(3),
                                Forms\Components\Textarea::make('rules')
                                    ->label('Category Rules')
                                    ->helperText('Shown to users on the category page. Leave blank to hide.')
                                    ->rows(4),
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
