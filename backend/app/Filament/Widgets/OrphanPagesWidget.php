<?php

namespace App\Filament\Widgets;

use App\Services\InternalLinkService;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class OrphanPagesWidget extends BaseWidget
{
    protected static ?string $heading = 'Orphan Pages (No Inbound Links)';
    protected int|string|array $columnSpan = 'full';
    protected static ?int $sort = 3;

    public function table(Table $table): Table
    {
        $orphans = InternalLinkService::findOrphanPages();

        // Convert to collection for table display
        $orphanIds = collect($orphans)->pluck('id')->toArray();

        return $table
            ->query(
                \App\Models\Article::query()
                    ->whereIn('id', $orphanIds)
                    ->orderBy('views', 'desc')
            )
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('Article')
                    ->searchable()
                    ->limit(50),
                Tables\Columns\TextColumn::make('views')
                    ->label('Views')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->date()
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('View')
                    ->icon('heroicon-o-eye')
                    ->url(fn($record) => "/news/{$record->slug}")
                    ->openUrlInNewTab(),
                Tables\Actions\Action::make('edit')
                    ->label('Edit')
                    ->icon('heroicon-o-pencil')
                    ->url(fn($record) => route('filament.admin.resources.articles.edit', $record)),
            ])
            ->emptyStateHeading('No orphan pages found')
            ->emptyStateDescription('All pages have at least one inbound link')
            ->emptyStateIcon('heroicon-o-check-circle');
    }
}
