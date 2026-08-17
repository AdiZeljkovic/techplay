<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BrokenLinkResource\Pages;
use App\Models\BrokenLink;
use App\Services\LinkChecker;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * The 62 dead links finally get somewhere to live.
 *
 * `ScanBrokenLinks` has run weekly since January and written to a table that
 * nothing in the panel ever read. The dashboard learned to count the rows in
 * August; a count you cannot act on from where you read it is a count you read
 * again next week, so this is the screen the number points at.
 *
 * It is built around one measured fact: **most of what the scanner records is
 * not a broken link.** Of the 62 on the books, 29 were 403s from x.com, reddit
 * and samsung — sites refusing a bot, not pages that had gone. Another ten were
 * 5xx from our own game pages during a restart, and three of those four answer
 * 200 today. Roughly a dozen entries were real.
 *
 * So the table does not lead with the URL. It leads with **what kind of problem
 * this is**, and it can ask the question again on the spot.
 */
class BrokenLinkResource extends Resource
{
    protected static ?string $model = BrokenLink::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-link-slash';

    protected static ?int $navigationSort = 60;

    protected static ?string $navigationLabel = 'Broken Links';

    protected static ?string $modelLabel = 'broken link';

    public static function getNavigationGroup(): ?string
    {
        return 'System';
    }

    /**
     * The badge is the count of links worth acting on, not the row count.
     *
     * A badge reading 62 when a dozen are real teaches you to ignore the badge.
     */
    public static function getNavigationBadge(): ?string
    {
        $n = static::getModel()::query()->unfixed()->gone()->count();

        return $n > 0 ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }

    public static function getEloquentQuery(): Builder
    {
        // The table shows the article title on every row. Without this it costs
        // one query per row, which on a page of 25 is 25 queries to draw one
        // column — the same mistake the other resources here already carry a
        // comment about.
        return parent::getEloquentQuery()->with('article:id,title,slug');
    }

    public static function form(Schema $schema): Schema
    {
        // Nothing here is editable by hand. A broken link is fixed by editing
        // the article that contains it, or by adding a redirect — both of which
        // are one click away in the table.
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('status_code')
            ->persistFiltersInSession()
            ->persistSortInSession()
            ->persistSearchInSession()
            ->paginationPageOptions([25, 50, 100])
            ->defaultPaginationPageOption(25)
            ->emptyStateIcon('heroicon-o-check-circle')
            ->emptyStateHeading('No broken links')
            ->emptyStateDescription(
                'The weekly scan checks every link in every published article. '
                .'Nothing it found is still outstanding.'
            )
            ->columns([
                /*
                 * First column is the diagnosis, not the URL. Sorting by status
                 * code then puts the 404s — the only group that is work — at the
                 * top of the list without anybody filtering for them.
                 */
                TextColumn::make('status_code')
                    ->label('Problem')
                    ->badge()
                    ->formatStateUsing(fn (BrokenLink $r): string => match ($r->classify()) {
                        'gone' => $r->status_code.' gone',
                        'blocked' => $r->status_code.' refused',
                        default => $r->status_code === 0 ? 'no answer' : $r->status_code.' error',
                    })
                    ->color(fn (BrokenLink $r): string => match ($r->classify()) {
                        'gone' => 'danger',
                        'blocked' => 'gray',
                        default => 'warning',
                    })
                    ->description(fn (BrokenLink $r): string => match ($r->classify()) {
                        'gone' => 'page is not there',
                        'blocked' => 'site refused the checker',
                        default => 'unreachable when last checked',
                    })
                    ->sortable(),

                TextColumn::make('url')
                    ->label('Link')
                    ->limit(58)
                    ->tooltip(fn (BrokenLink $r): string => $r->url)
                    ->copyable()
                    ->copyMessage('Link copied')
                    ->url(fn (BrokenLink $r): string => $r->url, shouldOpenInNewTab: true)
                    ->description(fn (BrokenLink $r): string => $r->isInternal() ? 'our own page' : (parse_url($r->url, PHP_URL_HOST) ?: ''))
                    ->searchable()
                    ->wrap(),

                TextColumn::make('article.title')
                    ->label('In article')
                    ->limit(40)
                    ->url(fn (BrokenLink $r): ?string => $r->article
                        ? NewsResource::getUrl('edit', ['record' => $r->article_id])
                        : null)
                    ->color('primary')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('last_checked_at')
                    ->label('Checked')
                    ->since()
                    ->tooltip(fn (BrokenLink $r): ?string => $r->last_checked_at?->format('d.m.Y H:i'))
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('error_message')
                    ->label('Detail')
                    ->limit(40)
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('kind')
                    ->label('Kind of problem')
                    ->options([
                        'gone' => 'Gone — the page is not there',
                        'blocked' => 'Refused — site blocked the checker',
                        'unreachable' => 'Unreachable — error or no answer',
                    ])
                    ->query(fn (Builder $q, array $data): Builder => match ($data['value'] ?? null) {
                        'gone' => $q->gone(),
                        'blocked' => $q->blocked(),
                        'unreachable' => $q->whereNotIn('status_code', [404, 410, 403, 405, 429, 451]),
                        default => $q,
                    }),

                TernaryFilter::make('internal')
                    ->label('Whose link')
                    ->placeholder('Any')
                    ->trueLabel('Ours (techplay.gg)')
                    ->falseLabel('Somebody else\'s')
                    ->queries(
                        true: fn (Builder $q) => $q->internal(),
                        false: fn (Builder $q) => $q->where('url', 'not like', '%techplay.gg%'),
                        blank: fn (Builder $q) => $q,
                    ),

                TernaryFilter::make('is_fixed')
                    ->label('Fixed')
                    ->placeholder('Outstanding only')
                    ->trueLabel('Fixed')
                    ->falseLabel('Outstanding')
                    ->queries(
                        true: fn (Builder $q) => $q->where('is_fixed', true),
                        false: fn (Builder $q) => $q->where('is_fixed', false),
                        blank: fn (Builder $q) => $q->where('is_fixed', false),
                    ),
            ])
            ->recordActions([
                /*
                 * The action the screen exists for.
                 *
                 * Status codes go stale the moment they are written. Three of
                 * the four 5xx entries examined the day this was built answered
                 * 200 by then — the scan had run during a restart. Without a way
                 * to ask again, the only way to clear a stale row is to trust it
                 * and delete it, which is how a list stops being trusted.
                 */
                Action::make('recheck')
                    ->label('Check again')
                    ->icon('heroicon-m-arrow-path')
                    ->color('gray')
                    ->action(function (BrokenLink $record): void {
                        $result = app(LinkChecker::class)->check($record->url);

                        $record->update([
                            'status_code' => $result['status_code'],
                            'error_message' => $result['error_message'],
                            'last_checked_at' => now(),
                            'is_fixed' => $result['ok'],
                        ]);

                        $result['ok']
                            ? Notification::make()
                                ->title('Link works')
                                ->body('Answered '.$result['status_code'].'. Marked as fixed.')
                                ->success()
                                ->send()
                            : Notification::make()
                                ->title('Still failing')
                                ->body('Answered '.($result['status_code'] ?: 'nothing').'.')
                                ->warning()
                                ->send();
                    }),

                Action::make('fixed')
                    ->label('Mark fixed')
                    ->icon('heroicon-m-check')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Mark as fixed')
                    ->modalDescription('It stays in the table but leaves the outstanding list. The weekly scan will record it again if it is still broken.')
                    ->visible(fn (BrokenLink $r): bool => ! $r->is_fixed)
                    ->action(fn (BrokenLink $r) => $r->markAsFixed()),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    /*
                     * Ten seconds of network per link, so the group is capped.
                     * Filament runs this in the request, and a page of 100 links
                     * would sit past any sensible timeout.
                     */
                    BulkAction::make('recheckMany')
                        ->label('Check again')
                        ->icon('heroicon-m-arrow-path')
                        ->color('gray')
                        ->action(function (Collection $records): void {
                            $checker = app(LinkChecker::class);
                            $fixed = 0;

                            foreach ($records->take(25) as $record) {
                                $result = $checker->check($record->url);
                                $record->update([
                                    'status_code' => $result['status_code'],
                                    'error_message' => $result['error_message'],
                                    'last_checked_at' => now(),
                                    'is_fixed' => $result['ok'],
                                ]);
                                $fixed += $result['ok'] ? 1 : 0;
                            }

                            $skipped = max(0, $records->count() - 25);

                            Notification::make()
                                ->title($fixed.' of '.min($records->count(), 25).' now work')
                                ->body($skipped > 0 ? $skipped.' left unchecked — 25 at a time.' : null)
                                ->success()
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),

                    BulkAction::make('markFixed')
                        ->label('Mark fixed')
                        ->icon('heroicon-m-check')
                        ->color('success')
                        ->requiresConfirmation()
                        ->action(fn (Collection $records) => $records->each->markAsFixed())
                        ->deselectRecordsAfterCompletion(),

                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBrokenLinks::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        // Rows arrive from the weekly scan. Typing one in by hand would record a
        // problem nobody has verified.
        return false;
    }
}
