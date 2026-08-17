<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BountyTransactionResource\Pages;
use App\Models\BountyTransaction;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * The bounty ledger, read-only.
 *
 * Every award and spend passes through here with a running `balance_after` and
 * an idempotency `reference`, which makes it the one place a disputed balance
 * can be settled — and there was no way to look at it short of a database
 * console. It is deliberately not editable: a ledger you can edit answers
 * nothing, because the answer it gives is whatever was last typed into it.
 */
class BountyTransactionResource extends Resource
{
    protected static ?string $model = BountyTransaction::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Bounty Ledger';

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['user']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 14;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit(Model $record): bool
    {
        return false;
    }

    public static function canDelete(Model $record): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('When')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.username')
                    ->label('User')
                    ->searchable()
                    ->url(fn (BountyTransaction $record) => $record->user_id
                        ? UserResource::getUrl('edit', ['record' => $record->user_id])
                        : null),

                Tables\Columns\TextColumn::make('amount')
                    ->numeric()
                    ->sortable()
                    // A ledger reads wrong without its sign: +250 and -250 are
                    // the same number and opposite events.
                    ->formatStateUsing(fn (int $state) => ($state > 0 ? '+' : '').number_format($state))
                    ->color(fn (int $state) => $state >= 0 ? 'success' : 'danger'),

                Tables\Columns\TextColumn::make('balance_after')
                    ->label('Balance after')
                    ->numeric()
                    ->alignEnd(),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->searchable(),

                Tables\Columns\TextColumn::make('reason')
                    ->wrap()
                    ->limit(60)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('reference')
                    ->label('Idempotency key')
                    ->fontFamily('mono')
                    ->limit(28)
                    ->copyable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options(fn () => BountyTransaction::query()
                        ->distinct()
                        ->orderBy('type')
                        ->pluck('type', 'type')
                        ->all()),
            ])
            ->actions([])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBountyTransactions::route('/'),
        ];
    }
}
