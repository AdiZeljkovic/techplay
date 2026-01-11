<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ThreadResource\Pages;
use App\Models\Thread;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Components\Utilities\Set;
use Illuminate\Support\Str;
use Filament\Schemas\Schema;


class ThreadResource extends Resource
{
    protected static ?string $model = Thread::class;

    protected static ?string $recordTitleAttribute = 'title';

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
                                Forms\Components\Select::make('category_id')
                                    ->relationship('category', 'name')
                                    ->required(),
                                Forms\Components\TextInput::make('title')
                                    ->required()
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),
                                Forms\Components\TextInput::make('slug')
                                    ->required()
                                    ->unique(ignoreRecord: true),
                                Forms\Components\RichEditor::make('content')
                                    ->columnSpanFull(),
                                Forms\Components\Toggle::make('is_pinned'),
                                Forms\Components\Toggle::make('is_locked'),
                            ])
                    ])
                    ->columnSpanFull()
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('category.name')
                    ->sortable()
                    ->label('Category')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('author.username')
                    ->sortable()
                    ->label('Author')
                    ->placeholder('-'),
                Tables\Columns\IconColumn::make('is_pinned')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_locked')
                    ->boolean(),
                Tables\Columns\TextColumn::make('view_count')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
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
            'index' => Pages\ListThreads::route('/'),
            'create' => Pages\CreateThread::route('/create'),
            'edit' => Pages\EditThread::route('/{record}/edit'),
        ];
    }
}
