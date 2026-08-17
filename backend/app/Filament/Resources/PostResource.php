<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PostResource\Pages;
use App\Models\Post;
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

class PostResource extends Resource
{
    /**
     * Hidden while the table is empty.
     *
     * The screen still exists and still works — this only keeps a row out of a
     * sidebar of forty-two, where a permanent zero is a row the eye learns to
     * skip. It comes back on its own with the first record.
     */
    public static function shouldRegisterNavigation(): bool
    {
        return static::getModel()::query()->exists();
    }

    protected static ?string $model = Post::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-pencil-square';

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['author', 'thread']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 60;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Tabs')
                    ->tabs([
                        Tab::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Forms\Components\Select::make('thread_id')
                                    ->relationship('thread', 'title')
                                    ->required()
                                    ->searchable(),
                                Forms\Components\Select::make('author_id')
                                    ->relationship('author', 'username')
                                    ->required()
                                    ->searchable(),
                                Forms\Components\RichEditor::make('content')
                                    ->required()
                                    ->columnSpanFull(),
                                Forms\Components\Toggle::make('is_solution')
                                    ->label('Mark as Solution'),
                            ]),
                    ])->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable(),
                Tables\Columns\TextColumn::make('thread.title')
                    ->limit(30)
                    ->searchable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('author.username')
                    ->searchable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('content')
                    ->html()
                    ->limit(50)
                    ->placeholder('-'),
                Tables\Columns\IconColumn::make('is_solution')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
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
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPosts::route('/'),
            'create' => Pages\CreatePost::route('/create'),
            'edit' => Pages\EditPost::route('/{record}/edit'),
        ];
    }
}
