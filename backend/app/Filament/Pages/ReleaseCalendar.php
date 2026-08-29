<?php

namespace App\Filament\Pages;

use App\Models\Game;
use App\Models\GameMatchDecision;
use App\Models\GameStoreLink;
use App\Services\Releases\GameMatcher;
use App\Services\Releases\GameMerger;
use App\Services\Releases\TitleNormalizer;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Where an editor settles what the aggregator would not settle alone.
 *
 * The calendar folds a game arriving from several stores into one entry, but
 * only when it is safe to. Anything closer than certain — "Outcasts Reborn"
 * against "Outcast Reborn", two days apart — is left here rather than fused on
 * a hunch, because an unmerged duplicate is visible and embarrassing while a
 * wrong merge is invisible and wrong.
 *
 * A ruling made here is permanent. It is stored against the normalised titles
 * rather than the games, so it survives one of them being merged away, and
 * every later sync obeys it without asking again.
 */
class ReleaseCalendar extends Page
{
    protected string $view = 'filament.pages.release-calendar';

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-calendar-days';
    }

    public static function getNavigationLabel(): string
    {
        return 'Release Calendar';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    /**
     * First in the group, above News.
     *
     * It used to be a group of its own called Editorial Tools, containing
     * nothing else. A group of one is a heading with no work to do; the
     * calendar is where the week's publishing gets planned, so it belongs at
     * the top of the content list rather than beside it.
     */
    public static function getNavigationSort(): ?int
    {
        return 10;
    }

    /** Where the badge count lives, so the two places that clear it agree. */
    private const BADGE_KEY = 'release-calendar.pending-count';

    /**
     * The number in the sidebar, which is drawn on every navigation.
     *
     * Uncached, this was the most expensive thing in the panel by a wide
     * margin: `pending()` hydrates every game carrying a match_key — 2,924 of
     * them on production — with their store links, compares them pairwise, and
     * asks the decisions table about each candidate pair. The panel is a SPA,
     * so that ran on every click, for every member of staff, to render a number
     * that changes when the weekly pipeline runs or when somebody rules on a
     * pair. Both of those clear the key, so the TTL is only a backstop.
     */
    public static function getNavigationBadge(): ?string
    {
        $waiting = Cache::remember(
            self::BADGE_KEY,
            now()->addMinutes(15),
            fn () => count(app(static::class)->pending()),
        );

        return $waiting > 0 ? (string) $waiting : null;
    }

    /** A ruling changes the queue, so the badge must not answer from before it. */
    private static function forgetBadge(): void
    {
        Cache::forget(self::BADGE_KEY);
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();

        return $user && (
            $user->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor'])
            || $user->isAdmin()
        );
    }

    /**
     * Pairs the rules would not decide. Nothing here is a fault — it is the
     * queue doing its job.
     *
     * @return array<int,array>
     */
    public function pending(): array
    {
        $merger = app(GameMerger::class);
        $matcher = app(GameMatcher::class);
        $rows = [];

        foreach ($merger->candidates() as [$left, $right]) {
            $verdict = $matcher->verdict($this->describe($left), $this->describe($right));

            if ($verdict !== GameMatcher::REVIEW) {
                continue;
            }

            $rows[] = ['left' => $left, 'right' => $right];
        }

        return $rows;
    }

    /** What the aggregator currently holds, per store. */
    public function inventory(): array
    {
        return GameStoreLink::query()
            ->selectRaw('store, count(*) filter (where game_id is not null) as listed, count(*) as seen, max(last_synced_at) as synced')
            ->groupBy('store')
            ->orderBy('store')
            ->get()
            ->map(fn ($row) => [
                'store' => $row->store,
                'listed' => (int) $row->listed,
                'seen' => (int) $row->seen,
                'synced' => $row->synced,
            ])
            ->all();
    }

    public function entriesTotal(): int
    {
        return Game::whereNotNull('match_key')->count();
    }

    /** These are one game. Record it, then fold them together. */
    public function same(int $leftId, int $rightId): void
    {
        [$left, $right] = [Game::find($leftId), Game::find($rightId)];

        if (! $left || ! $right) {
            return;
        }

        $this->remember($left, $right, true);

        // The merger reads the ruling and does the rest, so the fields are
        // combined by the same rules as every other merge.
        app(GameMerger::class)->run();

        Notification::make()
            ->title('Merged')
            ->body("{$left->name} and {$right->name} are now one entry.")
            ->success()
            ->send();
    }

    /** These are different games. Record it so nothing asks again. */
    public function different(int $leftId, int $rightId): void
    {
        [$left, $right] = [Game::find($leftId), Game::find($rightId)];

        if (! $left || ! $right) {
            return;
        }

        $this->remember($left, $right, false);

        Notification::make()
            ->title('Kept apart')
            ->body("{$left->name} and {$right->name} will not be merged.")
            ->success()
            ->send();
    }

    private function remember(Game $left, Game $right, bool $same): void
    {
        $normalizer = app(TitleNormalizer::class);
        $matcher = app(GameMatcher::class);

        [$a, $b] = $matcher->orderedPair(
            $normalizer->key($left->name),
            $normalizer->key($right->name),
        );

        GameMatchDecision::updateOrCreate(
            ['left_key' => $a, 'right_key' => $b],
            ['same_game' => $same, 'decided_by' => auth()->id()],
        );

        self::forgetBadge();
    }

    /** @return array{title:string,released:?string,publisher:?string} */
    private function describe(Game $game): array
    {
        return [
            'title' => $game->name,
            'released' => $game->released?->toDateString(),
            'publisher' => ($game->publishers ?? [])[0] ?? null,
        ];
    }

    /** Rulings already made, so a mistake can be found and undone. */
    public function decisions(): array
    {
        return GameMatchDecision::with('decidedBy')
            ->latest()
            ->limit(20)
            ->get()
            ->all();
    }

    public function undo(int $decisionId): void
    {
        GameMatchDecision::whereKey($decisionId)->delete();

        self::forgetBadge();

        Notification::make()
            ->title('Ruling withdrawn')
            ->body('The pair will be offered again on the next pass.')
            ->success()
            ->send();
    }

    /** A quick sense of where the month stands, for the header. */
    public function upcomingByMonth(): array
    {
        return Game::query()
            ->whereNotNull('match_key')
            ->whereNotNull('released')
            ->where('released', '>=', now()->startOfMonth()->toDateString())
            ->select(DB::raw("to_char(released, 'YYYY-MM') as month"), DB::raw('count(*) as tally'))
            ->groupBy('month')
            ->orderBy('month')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['month' => $row->month, 'tally' => (int) $row->tally])
            ->all();
    }
}
