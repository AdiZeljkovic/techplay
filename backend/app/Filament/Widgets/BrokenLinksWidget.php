<?php

namespace App\Filament\Widgets;

use App\Models\BrokenLink;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class BrokenLinksWidget extends BaseWidget
{
    protected ?string $heading = 'Broken Links';
    protected int|string|array $columnSpan = 'full';
    protected int $sort = 2;

    public function table(Table $table): Table
    {
        return $table
            ->query(
                BrokenLink::query()
                    ->where('is_fixed', false)
                    ->with('article:id,title,slug')
                    ->orderBy('last_checked_at', 'desc')
            )
            ->columns([
                Tables\Columns\TextColumn::make('article.title')
                    ->label('Article')
                    ->searchable()
                    ->limit(40),
                Tables\Columns\TextColumn::make('url')
                    ->label('Broken URL')
                    ->limit(50)
                    ->tooltip(fn($record) => $record->url),
                Tables\Columns\BadgeColumn::make('status_code')
                    ->label('Status')
                    ->color(fn($state) => match (true) {
                        $state === 404 => 'danger',
                        $state >= 500 => 'danger',
                        $state === 0 => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('last_checked_at')
                    ->label('Checked')
                    ->since(),
            ])
            ->actions([
                Tables\Actions\Action::make('markFixed')
                    ->label('Mark Fixed')
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->action(fn($record) => $record->markAsFixed())
                    ->requiresConfirmation(),
                Tables\Actions\Action::make('editArticle')
                    ->label('Edit Article')
                    ->icon('heroicon-o-pencil')
                    ->url(fn($record) => route('filament.admin.resources.articles.edit', $record->article_id)),
            ])
            ->emptyStateHeading('No broken links found')
            ->emptyStateDescription('Run: php artisan seo:scan-links')
            ->emptyStateIcon('heroicon-o-check-circle');
    }
}
