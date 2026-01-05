<?php

namespace App\Filament\Resources\Tasks\Pages;

use App\Filament\Resources\Tasks\TaskResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTasks extends ListRecords
{
    protected static string $resource = TaskResource::class;

    public function getView(): string
    {
        return 'filament.pages.kanban-board';
    }

    public function getViewData(): array
    {
        return [
            'tasks' => \App\Models\Task::with('assignee')->orderBy('priority', 'desc')->get(),
        ];
    }

    public function updateTaskStatus($taskId, $status)
    {
        $task = \App\Models\Task::find($taskId);
        if ($task) {
            $task->update(['status' => $status]);
            $this->dispatch('task-updated');
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
