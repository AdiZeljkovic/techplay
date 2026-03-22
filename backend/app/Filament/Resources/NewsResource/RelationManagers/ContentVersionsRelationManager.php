<?php

namespace App\Filament\Resources\NewsResource\RelationManagers;

use App\Models\ContentVersion;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Actions\Action as TableAction;

class ContentVersionsRelationManager extends RelationManager
{
    protected static string $relationship = 'versions';

    protected static ?string $title = 'Version History';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('#')
                    ->sortable(),
                TextColumn::make('title')
                    ->label('Title at save')
                    ->limit(60),
                TextColumn::make('change_summary')
                    ->label('Note'),
                TextColumn::make('creator.username')
                    ->label('Saved by'),
                TextColumn::make('created_at')
                    ->label('Saved at')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                TableAction::make('restore')
                    ->label('Restore')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->action(function (ContentVersion $record) {
                        $record->versionable->update([
                            'title' => $record->title,
                            'content' => $record->content,
                        ]);
                    }),
            ]);
    }
}
