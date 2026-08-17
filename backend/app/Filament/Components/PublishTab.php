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
 * Only the News copy offered **Scheduled** as a status. The other three did
 * not, so a review, a guide or a hardware piece could not be scheduled — while
 * `articles:publish-scheduled` has been running every minute the whole time,
 * and every one of those screens still showed a "Publish Date" field that
 * therefore did nothing but sit there.
 *
 * That is the argument for extraction in one sentence: the bug was not that
 * four files were long, it was that three of them were quietly a version
 * behind.
 */
class PublishTab
{
    /**
     * @param  string  $categoryType  value of `categories.type` to filter by; null hides the picker entirely
     * @param  string  $noun  what this thing is called in helper text — "article", "review", "guide"
     * @param  bool  $withGameLink  whether the record can point at a game in the catalogue
     * @param  bool  $withHeroToggle  whether it can be pinned to the homepage hero
     * @param  array  $extra  fields only this type has, placed where the category picker would sit — Guides file by difficulty instead of category
     */
    public static function make(
        ?string $categoryType = null,
        string $noun = 'article',
        bool $withGameLink = false,
        bool $withHeroToggle = true,
        array $extra = [],
    ): Tab {
        return Tab::make('Publish')
            ->icon('heroicon-o-paper-airplane')
            ->schema(array_values(array_filter(array_merge([
                Select::make('status')
                    ->label('Status')
                    ->options([
                        'draft' => '📝 Draft',
                        'ready_for_review' => '👁️ Pending Review',
                        'scheduled' => '🕐 Scheduled',
                        'published' => '🌐 Published',
                    ])
                    ->default('draft')
                    ->required()
                    ->native(false)
                    ->helperText('Use "Scheduled" to publish automatically on the date below.'),

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
                    ->label('🌟 Feature in homepage hero')
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
                'beginner' => '🟢 Beginner',
                'intermediate' => '🟡 Intermediate',
                'advanced' => '🔴 Advanced',
            ])
            ->required()
            ->native(false)
            ->helperText('Skill level required');
    }
}
