<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * A strip above a list, saying what the list would take a minute to tell you.
 *
 * ── Which lists get one, and which do not ─────────────────────────────────
 *
 * Every list in the panel was measured before any of these were written, and
 * most of them do not get a strip. The rule is the one the dashboard console
 * follows: **a number earns its place by changing what you do next.**
 *
 * Six passed. The ones that did not are worth naming, because "add stats to
 * every list" is the obvious instinct and it is wrong:
 *
 * - **Comments.** All 19 are `approved`, and no comment has ever held any other
 *   status. A moderation counter there would be a permanent zero — the exact
 *   thing the article lists were just cured of.
 * - **Orders, Products, Reports, Posts, Game Ratings, User Supports.** Zero
 *   rows each. A header on an empty list is decoration.
 * - **GTA 6 characters, vehicles, weapons; ranks, seasons, roles, categories,
 *   quests, achievements.** Reference and configuration. Nothing about them
 *   moves, so nothing about them is news.
 * - **Users.** Fifty-two rows, three new in a month. Real, but it never changes
 *   what anybody does on that screen.
 *
 * ── How the lead figure knows what "late" means ───────────────────────────
 *
 * The editorial strips lead on days since the last publish, and the threshold
 * is not a number somebody picked. Each desk is compared against **its own**
 * median interval over the past year:
 *
 * | desk | median gap | since last |
 * |---|---|---|
 * | News | 0.1 days | 1 day |
 * | Reviews | 5.2 days | **41 days** |
 * | Tech | 5.9 days | 15 days |
 * | Guides | 34.2 days | 24 days |
 *
 * A fixed "warn after a week" would have shouted at News, which publishes
 * several times a day, and stayed silent about Guides. Against its own cadence,
 * Reviews is at eight times normal and Guides is early — which is the true
 * reading and the one a person would give.
 */
abstract class ListPulse extends Widget
{
    protected string $view = 'filament.widgets.list-pulse';

    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = -10;

    /*
     * Not lazy.
     *
     * Filament defers a widget by default and fetches it in a second request,
     * which is right for something expensive. This is one cached row of
     * aggregates sitting directly under the page heading, and deferring it means
     * the list visibly reflows a beat after it paints — a flinch on every load,
     * to save a query that is already answered from cache four times out of five.
     */
    protected static bool $isLazy = false;

    /**
     * How long the numbers may be stale.
     *
     * Five minutes. These sit above a list somebody reloads all day; a fresh
     * aggregate per reload is a cost with no reader.
     */
    protected const TTL = 300;

    /**
     * @return array{lead: array{label: string, value: string, unit?: string, tone?: string}, figures: array<int, array{label: string, value: string, tone?: string}>, note?: string|null}
     */
    abstract protected function pulse(): array;

    /** @return array<string, mixed> */
    public function getPulse(): array
    {
        return Cache::remember('pulse.'.static::class, static::TTL, fn () => $this->pulse());
    }

    /**
     * The interval this thing is normally published at, in days.
     *
     * Median rather than mean, because one burst of five posts in an afternoon
     * would drag an average down and make a fortnight of silence look normal.
     *
     * @param  Collection<int, mixed>  $dates
     */
    protected static function medianGap($dates): ?float
    {
        $sorted = $dates
            ->filter()
            ->map(fn ($date) => Carbon::parse($date))
            ->sortDesc()
            ->values();

        if ($sorted->count() < 3) {
            return null;
        }

        $gaps = [];

        for ($i = 0; $i < $sorted->count() - 1; $i++) {
            $gaps[] = abs($sorted[$i]->diffInDays($sorted[$i + 1]));
        }

        sort($gaps);

        return (float) $gaps[intdiv(count($gaps), 2)];
    }

    /**
     * Late against its own habit, with a floor.
     *
     * The floor matters: News has a median gap of a tenth of a day, and without
     * one a single quiet afternoon would read as an emergency.
     */
    protected static function lateness(?float $daysSince, ?float $median): string
    {
        if ($daysSince === null) {
            return 'idle';
        }

        if ($median === null) {
            return $daysSince >= 30 ? 'warn' : 'idle';
        }

        return match (true) {
            $daysSince >= max(7, $median * 4) => 'bad',
            $daysSince >= max(3, $median * 2) => 'warn',
            default => 'good',
        };
    }

    /** 1,414 → 1.4k, so a figure strip stays a strip. */
    protected static function compact(int $value): string
    {
        if (abs($value) < 1000) {
            return (string) $value;
        }

        return rtrim(rtrim(number_format($value / 1000, 1), '0'), '.').'k';
    }
}
