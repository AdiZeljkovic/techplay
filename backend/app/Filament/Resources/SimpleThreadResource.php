<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SimpleThreadResource\Pages;
use App\Models\Thread;
use BackedEnum;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Forms;

class SimpleThreadResource extends Resource
{
    protected static ?string $model = Thread::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-chat-bubble-left-right';
    protected static string|\UnitEnum|null $navigationGroup = 'Community';
    protected static ?string $navigationLabel = 'Threads';
    protected static ?string $slug = 'threads';

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
                \Filament\Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                \Filament\Tables\Columns\TextColumn::make('category.name')
                    ->label('Category')
                    ->sortable(),
                \Filament\Tables\Columns\TextColumn::make('author.username')
                    ->label('Author')
                    ->sortable(),
                \Filament\Tables\Columns\IconColumn::make('is_pinned')
                    ->boolean(),
                \Filament\Tables\Columns\IconColumn::make('is_locked')
                    ->boolean(),
                \Filament\Tables\Columns\TextColumn::make('view_count')
                    ->sortable(),
                \Filament\Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                \Filament\Actions\EditAction::make(),
            ])
            ->bulkActions([
                \Filament\Actions\BulkActionGroup::make([
                    \Filament\Actions\DeleteBulkAction::make(),
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
