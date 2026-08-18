<?php

namespace App\Filament\Components;

use App\Models\Game;
use App\Services\CacheService;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;

/**
 * The Publish tab, written once instead of four times.
 *
 * News, Reviews, Guides and Tech each carried their own copy — 46 to 59 lines
 * apiece, and a diff of any two showed the differences were a category type,
 * the noun in three helper texts, and an import style. This is the pattern the
 * panel already uses for the other two tabs in the same rail: `SeoFields::make()`
 * and `MediaPickerFields::make()` have been shared across all four for a while,
 * which is why the SEO and Media tabs never drifted and this one did.
 *
 * ── What the drift cost ──────────────────────────────────────────────────
 *
 * Only the News copy offered **Scheduled** as a status. Reviews and Tech did
 * not, so neither could be scheduled — while `articles:publish-scheduled` has
 * been running every minute the whole time, and both screens still showed a
 * "Publish Date" field that therefore did nothing but sit there.
 *
 * That is the argument for extraction in one sentence: the bug was not that
 * four files were long, it was that some of them were quietly a version behind.
 *
 * ── And the trap that nearly replaced it ─────────────────────────────────
 *
 * The first version of this class handed "Scheduled" to all four callers,
 * which would have been a worse bug than the one it fixed. Guides are **not
 * articles**: `GuideResource` is backed by its own `Guide` model on its own
 * table, and the scheduler queries `Article`. A scheduled guide would have sat
 * at that status forever, with the screen implying it was on its way.
 *
 * Hence `$withScheduling`. A control is only offered where something is
 * listening for it.
 */
class PublishTab
{
    /**
     * @param  string  $categoryType  value of `categories.type` to filter by; null hides the picker entirely
     * @param  string  $noun  what this thing is called in helper text — "article", "review", "guide"
     * @param  bool  $withGameLink  whether the record can point at a game in the catalogue
     * @param  bool  $withHeroToggle  whether it can be pinned to the homepage hero
     * @param  array  $extra  fields only this type has, placed where the category picker would sit — Guides file by difficulty instead of category
     * @param  bool  $withScheduling  offer "Scheduled" as a status. Only true where something actually publishes it: `articles:publish-scheduled` queries `Article`, and Guides are their own model on their own table, so a scheduled guide would sit at that status forever. Offering a switch that is not wired to anything is worse than not offering it.
     */
    public static function make(
        ?string $categoryType = null,
        string $noun = 'article',
        bool $withGameLink = false,
        bool $withHeroToggle = true,
        array $extra = [],
        bool $withScheduling = true,
    ): Tab {
        return Tab::make('Publish')
            ->icon('heroicon-o-paper-airplane')
            ->schema(array_values(array_filter(array_merge([
                Select::make('status')
                    ->label('Status')
                    ->options(array_filter([
                        'draft' => 'Draft',
                        'ready_for_review' => 'Pending review',
                        'scheduled' => $withScheduling ? 'Scheduled' : null,
                        'published' => 'Published',
                    ]))
                    ->default('draft')
                    ->required()
                    ->native(false)
                    ->helperText($withScheduling
                        ? 'Use "Scheduled" to publish automatically on the date below.'
                        : 'Publishing here is manual.'),

                DateTimePicker::make('published_at')
                    ->label('Publish date')
                    ->native(false)
                    ->displayFormat('M j, Y • g:i A')
                    ->default(now())
                    ->helperText('When this '.$noun.' goes live.'),

                $categoryType === null ? null : Select::make('category_id')
                    ->label('Category')
                    // Only leaf categories: a parent is a section, not somewhere
                    // an article is filed.
                    ->relationship('category', 'name', fn (Builder $query) => $query
                        ->where('type', $categoryType)
                        ->whereNotNull('parent_id'))
                    ->searchable()
                    ->preload()
                    ->required()
                    ->native(false),
            ], $extra, [
                TagsInput::make('tags')
                    ->label('Tags')
                    ->placeholder('Add tag...')
                    ->helperText('Press Enter after each tag'),

                ! $withHeroToggle ? null : Toggle::make('is_featured_in_hero')
                    ->label('Feature in homepage hero')
                    ->helperText('Pin this '.$noun.' to the top of the homepage'),

                ! $withGameLink ? null : Select::make('game_id')
                    ->label('Linked game')
                    ->placeholder('Search the games database...')
                    ->searchable()
                    // 187k rows: search on demand rather than loading options.
                    ->getSearchResultsUsing(fn (string $search) => Game::query()
                        ->where('name', 'ilike', "%{$search}%")
                        ->orderByDesc('rating')
                        ->limit(20)
                        ->pluck('name', 'id')
                        ->toArray())
                    ->getOptionLabelUsing(fn ($value) => Game::find($value)?->name)
                    ->helperText('Auto-detected from the title on save; set it here to override.'),

                Select::make('author_id')
                    ->label('Author')
                    ->options(fn () => CacheService::getAuthors())
                    ->searchable()
                    ->default(fn () => auth()->id())
                    ->required()
                    ->native(false),
            ]))));
    }

    /**
     * The three levels a guide can be written at.
     *
     * Guides file by difficulty rather than by category, so this is the one
     * field that arrives through `$extra` rather than living in the tab.
     */
    public static function difficulty(): Select
    {
        return Select::make('difficulty')
            ->label('Difficulty')
            ->options([
                'beginner' => 'Beginner',
                'intermediate' => 'Intermediate',
                'advanced' => 'Advanced',
            ])
            ->required()
            ->native(false)
            ->helperText('Skill level required');
    }
}
