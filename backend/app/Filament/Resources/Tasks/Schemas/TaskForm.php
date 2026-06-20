<?php

namespace App\Filament\Resources\Tasks\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TaskForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->required()
                    ->maxLength(255),
                RichEditor::make('description')
                    ->columnSpanFull(),
                Select::make('status')
                    ->options([
                        'todo' => 'To Do',
                        'in_progress' => 'In Progress',
                        'review' => 'Review',
                        'done' => 'Done',
                    ])
                    ->required()
                    ->native(false),
                Select::make('priority')
                    ->options([
                        'low' => 'Low',
                        'medium' => 'Medium',
                        'high' => 'High',
                    ])
                    ->required()
                    ->native(false),
                DatePicker::make('due_date'),
                Select::make('assigned_to')
                    ->relationship('assignee', 'name', function ($query) {
                        return $query->whereHas('roles', function ($q) {
                            $q->whereIn('name', ['Super Admin', 'Editor-in-Chief', 'Editor', 'Journalist', 'Moderator']);
                        });
                    })
                    ->searchable()
                    ->preload(),
                Hidden::make('created_by')
                    ->default(fn () => auth()->id()),
            ]);
    }
}
