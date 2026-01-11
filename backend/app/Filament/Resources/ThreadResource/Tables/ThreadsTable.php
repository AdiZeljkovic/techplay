<?php

namespace App\Filament\Resources\ThreadResource\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\DeleteBulkAction;
use Illuminate\Support\Str;

class ThreadsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->state(fn($record) => $record->id)
                    ->sortable(),
                TextColumn::make('title')
                    ->state(fn($record) => $record->title)
                    ->description(fn($record) => Str::limit($record->slug, 20))
                    ->searchable()
                    ->sortable(),
                TextColumn::make('category.name')
                    ->state(fn($record) => $record->category?->name ?? 'No Category')
                    ->label('Category')
                    ->sortable(),
                TextColumn::make('author.username')
                    ->state(fn($record) => $record->author?->username ?? 'Unknown')
                    ->label('Author')
                    ->sortable(),
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
}
