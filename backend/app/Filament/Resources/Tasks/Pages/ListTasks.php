<?php

namespace App\Filament\Resources\Tasks\Pages;

use App\Filament\Resources\Tasks\TaskResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;

class ListTasks extends ListRecords
{
    protected static string $resource = TaskResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }

    public function getTabs(): array
    {
        return [
            'all' => \Filament\Resources\Components\Tab::make('All Tasks'),
            'todo' => \Filament\Resources\Components\Tab::make('To Do')
                ->modifyQueryUsing(fn($query) => $query->where('status', 'todo')),
            'in_progress' => \Filament\Resources\Components\Tab::make('In Progress')
                ->modifyQueryUsing(fn($query) => $query->where('status', 'in_progress')),
            'review' => \Filament\Resources\Components\Tab::make('Review')
                ->modifyQueryUsing(fn($query) => $query->where('status', 'review')),
            'done' => \Filament\Resources\Components\Tab::make('Done')
                ->modifyQueryUsing(fn($query) => $query->where('status', 'done')),
        ];
    }
}
