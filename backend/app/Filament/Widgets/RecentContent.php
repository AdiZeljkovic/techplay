<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

/**
 * The last ten things published, and how they are doing.
 *
 * Every other widget on this dashboard is a number. This one exists because
 * after "how many" the next question is always "which" — and an editor opening
 * the panel in the morning wants to see the pieces that went out, not a count
 * of them.
 *
 * Views are the only measure of performance here and they are honest about
 * being crude: a piece published an hour ago will always be below one published
 * last week, which is why the date sits next to the number rather than the
 * number standing alone.
 */
class RecentContent extends BaseWidget
{
    protected static ?int $sort = 5;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->heading('Zadnje objavljeno')
            ->query(
                Article::query()
                    ->where('status', 'published')
                    ->where('published_at', '<=', now())
                    // Filament does not eager load relationship columns by
                    // itself, and this table draws two of them.
                    ->with(['author', 'category'])
                    ->latest('published_at')
                    ->limit(10)
            )
            ->paginated(false)
            ->columns([
                TextColumn::make('title')
                    ->label('Naslov')
                    ->limit(60)
                    ->weight('medium')
                    ->searchable(false)
                    ->sortable(false),

                TextColumn::make('category.name')
                    ->label('Sekcija')
                    ->badge()
                    ->color(fn ($record) => match ($record->category?->type) {
                        'reviews' => 'warning',
                        'tech' => 'info',
                        default => 'gray',
                    })
                    ->sortable(false),

                TextColumn::make('author.display_name')
                    ->label('Autor')
                    ->default('—')
                    ->color('gray')
                    ->sortable(false),

                TextColumn::make('views')
                    ->label('Pregleda')
                    ->numeric()
                    ->alignEnd()
                    ->sortable(false),

                TextColumn::make('published_at')
                    ->label('Objavljeno')
                    ->since()
                    ->description(fn ($record) => $record->published_at?->format('d.m.Y H:i'))
                    ->alignEnd()
                    ->sortable(false),
            ])
            ->recordActions([
                Action::make('open')
                    ->label('Otvori')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->url(fn ($record) => config('app.site_url').'/'.match ($record->category?->type) {
                        'reviews' => 'reviews',
                        'tech' => 'hardware',
                        default => 'news',
                    }.'/'.$record->slug)
                    ->openUrlInNewTab(),
            ])
            ->emptyStateHeading('Još ništa nije objavljeno')
            ->emptyStateIcon('heroicon-o-document-text');
    }

    /**
     * Not everybody who can open the panel should read what everybody wrote —
     * but this is published content, which is public by definition. The one
     * thing it does not show is anything unpublished.
     */
    public static function canView(): bool
    {
        return true;
    }

    protected function getTableQuery(): ?Builder
    {
        return null;
    }
}
