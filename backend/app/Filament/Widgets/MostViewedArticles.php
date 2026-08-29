<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class MostViewedArticles extends BaseWidget
{
    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Most Viewed Articles';

    public function table(Table $table): Table
    {
        return $table
            /*
             * `popular()` only sorts. On the public home page it is handed a
             * query that already filters to published and past-dated, so it
             * behaves; here it was given the bare model, and every draft and
             * scheduled piece with a view count sat in a panel headed "Most
             * Viewed Articles". A draft has views because staff opened it.
             *
             * The eager load is for the Category column below, which was one
             * query per row — twenty-five on the largest page size.
             */
            ->query(
                Article::query()
                    ->where('status', 'published')
                    ->where('published_at', '<=', now())
                    ->with('category:id,name')
                    ->popular()
            )
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('category.name')
                    ->label('Category')
                    ->sortable(),
                Tables\Columns\TextColumn::make('views')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('success'),
                Tables\Columns\TextColumn::make('published_at')
                    ->dateTime()
                    ->sortable()
                    ->label('Published'),
            ])
            ->defaultSort('views', 'desc')
            ->paginated([5, 10, 25]);
    }
}
