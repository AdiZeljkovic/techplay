<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SimpleThreadResource\Pages;
use App\Models\Thread;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SimpleThreadResource extends Resource
{
    protected static ?string $model = Thread::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Threads';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('title')->required(),
                Forms\Components\Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                Forms\Components\Select::make('author_id')
                    ->relationship('author', 'username')
                    ->required(),
                Forms\Components\RichEditor::make('content')
                    ->columnSpanFull(),
                Forms\Components\Toggle::make('is_pinned'),
                Forms\Components\Toggle::make('is_locked'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('category.name')
                    ->label('Category')
                    ->sortable(),
                TextColumn::make('author.username')
                    ->label('Author')
                    ->sortable(),
                IconColumn::make('is_pinned')
                    ->boolean(),
                IconColumn::make('is_locked')
                    ->boolean(),
                TextColumn::make('view_count')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
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

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSimpleThreads::route('/'),
            'create' => Pages\CreateSimpleThread::route('/create'),
            'edit' => Pages\EditSimpleThread::route('/{record}/edit'),
        ];
    }
}
