<?php

namespace App\Filament\Widgets;

use App\Models\AdCampaign;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class TopPerformingAds extends BaseWidget
{
    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Top Performing Ad Campaigns';

    protected static ?int $sort = 3;

    public function table(Table $table): Table
    {
        return $table
            ->query(
                AdCampaign::query()
                    ->where('view_count', '>', 0)
                    ->orderByRaw('(click_count::float / NULLIF(view_count, 0)::float) DESC')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->description(fn($record) => $record->position),

                Tables\Columns\TextColumn::make('format')
                    ->badge()
                    ->color('info')
                    ->formatStateUsing(fn($state) => $state ? strtoupper($state) : 'N/A'),

                Tables\Columns\TextColumn::make('view_count')
                    ->label('Views')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('click_count')
                    ->label('Clicks')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('ctr')
                    ->label('CTR')
                    ->suffix('%')
                    ->sortable()
                    ->badge()
                    ->color(fn($state) => $state > 5 ? 'success' : ($state > 2 ? 'warning' : 'danger')),

                Tables\Columns\TextColumn::make('estimated_revenue')
                    ->label('Revenue')
                    ->money('BAM')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
            ])
            ->defaultSort('ctr', 'desc')
            ->paginated([10, 25, 50]);
    }
}
