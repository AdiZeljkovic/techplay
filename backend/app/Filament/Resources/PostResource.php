<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PostResource\Pages;
use App\Models\Post;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Schema;


class PostResource extends Resource
{
    protected static ?string $model = Post::class;

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Group::make()
                    ->schema([
                        Forms\Components\Section::make()
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
                            ])
                    ])
                    ->columnSpanFull()
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
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
