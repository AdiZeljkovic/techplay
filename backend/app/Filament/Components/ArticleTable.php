<?php

namespace App\Filament\Components;

use App\Services\CacheService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Enums\Alignment;
use Filament\Support\Enums\FontWeight;
use Filament\Tables\Columns\Column;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\BaseFilter;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\HtmlString;

/**
 * The article list, written once for News, Reviews, Tech and Guides.
 *
 * ── What the four lists were showing ──────────────────────────────────────
 *
 * Counted on the live database before anything here was written:
 *
 * | column        | News 528        | Reviews 38  | Tech 58      | Guides 4  |
 * |---------------|-----------------|-------------|--------------|-----------|
 * | Status        | 528 published   | 38 pub.     | 55 of 58     | 4 pub.    |
 * | Hero star     | 14 (2.7%)       | 2           | **0**        | —         |
 * | Views         | *hidden*        | *no column* | *hidden*     | *hidden*  |
 * | Author        | *no column*     | *no column* | *no column*  | shown     |
 *
 * Two whole columns carried no information. `Status` printed the same green
 * badge on every row of three of the four lists — a column that can never help
 * you find anything, sitting third from the right. The star column drew 514
 * empty outlines **in the accent red**, so the brightest repeated mark on the
 * screen meant "no".
 *
 * Meanwhile `views` — the one number that differs per row and answers the only
 * question an editor actually asks of a back catalogue — was toggled off by
 * default on all three lists that had it, and Reviews did not have it at all.
 * Reviews average 1,124 views against News' 116; nobody could see that.
 *
 * And with six people writing News, there was no author column and no author
 * filter on any of the three article lists.
 *
 * ── The rule this list follows ────────────────────────────────────────────
 *
 * The same one the dashboard console follows: **a column earns its width by
 * differing between rows.** So status and hero are no longer columns. They are
 * marks on the row's own meta line, and they appear only when they are not the
 * norm — a draft says draft, a hero says hero, and 528 published non-hero rows
 * say nothing at all. Both are still filterable, which is how you ask for them
 * on purpose rather than being told 528 times.
 *
 * What replaces them is what was hidden: the author, and the views.
 */
class ArticleTable
{
    /**
     * @param  string  $sitePath  path segment on techplay.gg, e.g. `news`
     * @param  string|null  $categoryType  `categories.type` for the category filter; null for Guides, which file by difficulty
     * @param  array<int, Column>  $extraColumns  columns only this type has, placed between the title and the counts
     * @param  array<int, BaseFilter>  $extraFilters
     * @param  string  $dateColumn  which timestamp the list is ordered and dated by
     */
    public static function configure(
        Table $table,
        string $sitePath,
        ?string $categoryType = null,
        array $extraColumns = [],
        array $extraFilters = [],
        string $dateColumn = 'published_at',
    ): Table {
        return $table
            ->columns(array_merge([
                /*
                 * 16:9, not a circle.
                 *
                 * Every article has cover art — 528 of 528, 38 of 38, 58 of 58 —
                 * and all of it is made for a 16:9 card. Cropping it to a 40px
                 * circle threw away the composition and, worse, made the column
                 * read as an avatar: the first thing on every row looked like it
                 * was telling you *who*, when it was telling you *what*.
                 */
                ImageColumn::make('featured_image_url')
                    ->label('')
                    ->imageHeight(40)
                    ->imageWidth(71)
                    ->rounded()
                    ->extraImgAttributes(['class' => 'tp-thumb', 'loading' => 'lazy']),

                TextColumn::make('title')
                    ->label('Article')
                    ->searchable()
                    ->sortable()
                    ->weight(FontWeight::Medium)
                    ->wrap()
                    ->lineClamp(2)
                    ->description(fn (Model $record) => static::meta($record)),
            ], $extraColumns, [
                /*
                 * The number that was hidden. Sorting by it is how you find out
                 * what worked, and the footer total makes every filter answer a
                 * question: pick an author, read their reach.
                 */
                TextColumn::make('views')
                    ->label('Views')
                    ->sortable()
                    ->alignment(Alignment::End)
                    ->formatStateUsing(fn ($state) => static::compact((int) $state))
                    ->extraAttributes(['class' => 'tp-figure'])
                    ->summarize(Sum::make()->label('Total')->formatStateUsing(fn ($state) => static::compact((int) $state))),

                /*
                 * Relative time is right for this week and useless past it — a
                 * back catalogue of "1 year ago" repeated three hundred times
                 * tells you nothing about order. Under a week it reads as recency,
                 * over a week it reads as a date.
                 */
                TextColumn::make($dateColumn)
                    ->label('Published')
                    ->sortable()
                    ->alignment(Alignment::End)
                    ->extraAttributes(['class' => 'tp-figure'])
                    ->formatStateUsing(function ($state) {
                        if (blank($state)) {
                            return '—';
                        }

                        $date = Carbon::parse($state);

                        return $date->gt(now()->subWeek())
                            ? $date->diffForHumans(short: true)
                            : $date->format('j M Y');
                    }),
            ]))
            ->defaultSort($dateColumn, 'desc')
            ->filters(array_merge([
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'ready_for_review' => 'Pending review',
                        'scheduled' => 'Scheduled',
                        'published' => 'Published',
                    ]),

                /*
                 * Six people write News and there was no way to ask for one of
                 * them. Options come from the same cached list the Publish tab
                 * uses, so the two screens can never disagree about who an author
                 * is.
                 */
                SelectFilter::make('author_id')
                    ->label('Author')
                    ->options(fn () => CacheService::getAuthors())
                    ->searchable(),

                Filter::make('is_featured_in_hero')
                    ->label('In homepage hero')
                    ->query(fn (Builder $query) => $query->where('is_featured_in_hero', true))
                    ->toggle(),
            ], $categoryType === null ? [] : [
                SelectFilter::make('category')
                    ->relationship('category', 'name', fn (Builder $query) => $query->where('type', $categoryType))
                    ->searchable()
                    ->preload(),
            ], $extraFilters))
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                /*
                 * Icons, not words. "View on site" and "Edit" spelled out took
                 * roughly 140px of every row to repeat the same two labels down
                 * the page; the tooltip says the same thing to anyone who needs
                 * it, once.
                 */
                Action::make('onSite')
                    ->label('View on site')
                    ->tooltip('Open on techplay.gg')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->iconButton()
                    ->url(fn (Model $record): string => config('app.site_url').'/'.$sitePath.'/'.$record->slug, shouldOpenInNewTab: true)
                    ->visible(fn (Model $record): bool => filled($record->slug) && $record->status === 'published'),

                EditAction::make()
                    ->tooltip('Edit')
                    ->iconButton(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    /**
     * The line under the headline: where it is filed, who wrote it, and — only
     * when it is not the ordinary case — what state it is in.
     *
     * This is the column-count saving. Section and author were worth two columns
     * and read better as a byline; status and hero were worth two more and read
     * better as exceptions. A published, non-hero article shows the byline and
     * nothing else, which is 97% of every list.
     */
    protected static function meta(Model $record): HtmlString
    {
        $parts = [];

        if ($record->is_featured_in_hero ?? false) {
            $parts[] = '<span class="tp-mark tp-mark--hero">Hero</span>';
        }

        // Guides file by difficulty; everything else by category.
        $section = $record->category?->name ?? $record->difficulty;

        if (filled($section)) {
            $parts[] = '<span class="tp-meta-section">'.e(ucfirst($section)).'</span>';
        }

        $author = $record->author?->username ?? $record->author?->name;

        if (filled($author)) {
            $parts[] = e($author);
        }

        $state = $record->status;

        if (filled($state) && $state !== 'published') {
            $label = match ($state) {
                'draft' => 'Draft',
                'ready_for_review' => 'Pending review',
                'scheduled' => 'Scheduled',
                default => ucfirst(str_replace('_', ' ', $state)),
            };

            $tone = $state === 'scheduled' ? 'sched' : 'draft';

            $parts[] = '<span class="tp-mark tp-mark--'.$tone.'">'.e($label).'</span>';
        }

        return new HtmlString(implode('<span class="tp-meta-dot">·</span>', $parts));
    }

    /**
     * 1,414 → 1.4k.
     *
     * Four-digit view counts in a column of three-digit ones make the column
     * about digit-width rather than about reach.
     */
    protected static function compact(int $value): string
    {
        if ($value < 1000) {
            return (string) $value;
        }

        return rtrim(rtrim(number_format($value / 1000, 1), '0'), '.').'k';
    }
}
