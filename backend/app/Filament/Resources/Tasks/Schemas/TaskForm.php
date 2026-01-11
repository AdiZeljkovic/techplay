<?php

namespace App\Filament\Resources\Tasks\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
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
                \Filament\Forms\Components\RichEditor::make('description')
                    ->columnSpanFull(),
                \Filament\Forms\Components\Select::make('status')
                    ->options([
                        'todo' => 'To Do',
                        'in_progress' => 'In Progress',
                        'review' => 'Review',
                        'done' => 'Done',
                    ])
                    ->required()
                    ->native(false),
                \Filament\Forms\Components\Select::make('priority')
                    ->options([
                        'low' => 'Low',
                        'medium' => 'Medium',
                        'high' => 'High',
                    ])
                    ->required()
                    ->native(false),
                DatePicker::make('due_date'),
                \Filament\Forms\Components\Select::make('assigned_to')
                    ->relationship('assignee', 'name', function ($query) {
                        return $query->whereHas('roles', function ($q) {
                            $q->whereIn('name', ['Super Admin', 'Editor-in-Chief', 'Editor', 'Journalist', 'Moderator']);
                        });
                    })
                    ->searchable()
                    ->preload(),
                \Filament\Forms\Components\Hidden::make('created_by')
                    ->default(fn() => auth()->id()),
            ]);
    }
}
