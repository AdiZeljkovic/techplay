<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ThreadResource\Pages\CreateThread;
use App\Filament\Resources\ThreadResource\Pages\EditThread;
use App\Filament\Resources\ThreadResource\Pages\ListThreads;
use App\Filament\Resources\ThreadResource\Schemas\ThreadForm;

use App\Models\Thread;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class ThreadResource extends Resource
{
    protected static ?string $model = Thread::class;

    protected static ?string $recordTitleAttribute = 'title';

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->withoutGlobalScopes();
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    public static function form(Schema $schema): Schema
    {
        return ThreadForm::configure($schema);
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
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListThreads::route('/'),
            'create' => CreateThread::route('/create'),
            'edit' => EditThread::route('/{record}/edit'),
        ];
    }
}
