<?php

namespace App\Filament\Resources\Tasks\Tables;

use App\Models\Article;
use App\Models\Task;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class TasksTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'todo' => 'gray',
                        'in_progress' => 'warning',
                        'review' => 'info',
                        'done' => 'success',
                        default => 'gray',
                    }),
                TextColumn::make('priority')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'low' => 'gray',
                        'medium' => 'info',
                        'high' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('due_date')
                    ->date()
                    ->sortable(),
                TextColumn::make('assignee.name')
                    ->label('Assigned To')
                    ->sortable(),
                TextColumn::make('creator.name')
                    ->label('Created By')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'todo' => 'To Do',
                        'in_progress' => 'In Progress',
                        'review' => 'Review',
                        'done' => 'Done',
                    ]),
                SelectFilter::make('priority')
                    ->options([
                        'low' => 'Low',
                        'medium' => 'Medium',
                        'high' => 'High',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
                Action::make('start_article')
                    ->label('Start Article')
                    ->icon('heroicon-o-document-plus')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Start Article from Task')
                    ->modalDescription('This will create a new Article draft based on this task and redirect you to the editor.')
                    ->action(function (Task $record) {
                        $article = Article::create([
                            'title' => $record->title,
                            'content' => $record->description, // Seed content with task description
                            'status' => 'draft',
                            'author_id' => $record->assigned_to ?? auth()->id(),
                            'slug' => Str::slug($record->title.'-'.uniqid()),
                            'published_at' => null,
                        ]);

                        // Update task status to In Progress
                        $record->update(['status' => 'in_progress']);

                        return redirect()->to("/admin/articles/{$article->id}/edit");
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
