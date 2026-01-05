<?php

namespace App\Filament\Resources\Threads;

use App\Filament\Resources\Threads\Pages\CreateThread;
use App\Filament\Resources\Threads\Pages\EditThread;
use App\Filament\Resources\Threads\Pages\ListThreads;
use App\Filament\Resources\Threads\Schemas\ThreadForm;
use App\Filament\Resources\Threads\Tables\ThreadsTable;
use App\Models\Thread;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ThreadResource extends Resource
{
    protected static ?string $model = Thread::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'title';

    protected static bool $shouldRegisterNavigation = false;

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
        return [
            //
        ];
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
