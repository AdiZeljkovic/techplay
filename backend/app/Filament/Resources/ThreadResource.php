<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ThreadResource\Pages\CreateThread;
use App\Filament\Resources\ThreadResource\Pages\EditThread;
use App\Filament\Resources\ThreadResource\Pages\ListThreads;
use App\Filament\Resources\ThreadResource\Schemas\ThreadForm;
use App\Filament\Resources\ThreadResource\Tables\ThreadsTable;
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
        return ThreadsTable::configure($table);
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
