<?php

namespace App\Services\Releases;

use App\Models\Game;
use App\Models\GameStoreLink;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Everything that is the same no matter which store we are reading.
 *
 * The stores differ only in how they are asked and what shape they answer in.
 * What happens to an answer — the quality gate, remembering a rejection,
 * noticing a delay, refusing to overrule an editor, retrying a request that
 * simply failed — is identical, and every one of those rules was learned the
 * hard way against Steam. Duplicating them per store is how they would quietly
 * drift apart.
 *
 * A subclass says where the titles come from and what a title looks like. This
 * decides what becomes of them.
 */
abstract class StoreSync
{
    /**
     * The marker for "the store could not answer about this one", as opposed to
     * a verdict about the game itself. Rows carrying it are retried.
     */
    public const UNREACHABLE = 'unavailable';

    /**
     * Somewhere to say what is happening before the per-title work starts.
     *
     * Discovery is instant for Steam and Nintendo but is the entire job for
     * Xbox, where a first pass spends minutes before it has a single title to
     * report. Silence there reads as a hang.
     */
    protected ?\Closure $onProgress = null;

    public function __construct(
        protected QualityFilter $filter,
        protected TitleNormalizer $normalizer,
    ) {}

    public function reportUsing(\Closure $callback): static
    {
        $this->onProgress = $callback;

        return $this;
    }

    /** 'steam', 'nintendo', … */
    abstract public function store(): string;

    /**
     * Every title the store lists inside the window.
     *
     * @return array<int,array{store_id:string,title:string,anchor:?Carbon,precision:string}>
     */
    abstract protected function discover(Carbon $from, Carbon $to): array;

    /**
     * The full record for one title, in the shape the quality gate reads.
     * Null means the store says there is no such product.
     *
     * @throws TransientFailure when the store could not be asked
     */
    abstract protected function details(array $row): ?array;

    /** Which platforms a title from this store runs on. */
    abstract protected function platformNames(array $row, array $details): array;

    /**
     * How long to wait between titles. Stores whose listing already carries
     * everything cost nothing per title and need no pacing at all.
     */
    protected function delayMs(): int
    {
        return (int) config('releases.delay_ms');
    }

    /**
     * Rejections worth revisiting.
     *
     * A verdict about the game — too little written about it, not a game at
     * all — is final, and re-fetching it would only reach the same answer. A
     * note that we could not reach the store is not a verdict at all.
     *
     * @return array<int,string>
     */
    protected function retryable(): array
    {
        return [self::UNREACHABLE];
    }

    /**
     * @param  ?\Closure  $onDiscovered  called once with the number of titles in
     *                                   the window, before any of them are handled
     * @param  ?\Closure  $progress  called for every title, whatever happens to it
     * @return array{seen:int,created:int,updated:int,rejected:int,unchanged:int,skipped:int}
     */
    public function run(
        ?Carbon $from = null,
        ?Carbon $to = null,
        ?\Closure $progress = null,
        ?\Closure $onDiscovered = null,
    ): array {
        [$from, $to] = $this->window($from, $to);

        $rows = $this->discover($from, $to);

        if ($onDiscovered) {
            $onDiscovered(count($rows));
        }

        $tally = ['seen' => count($rows), 'created' => 0, 'updated' => 0, 'rejected' => 0, 'unchanged' => 0, 'skipped' => 0];

        foreach ($rows as $row) {
            $link = GameStoreLink::where('store', $this->store())
                ->where('store_id', $row['store_id'])
                ->first();

            // A store that could not answer last time gets another chance.
            // Only verdicts about the game itself are final.
            if ($link && $link->game_id === null && in_array($link->rejected_reason, $this->retryable(), true)) {
                $link->delete();
                $link = null;
            }

            if ($link) {
                [$verdict, $reason] = $this->refresh($link, $row);
            } else {
                [$verdict, $reason] = $this->ingest($row);

                if ($this->delayMs() > 0) {
                    usleep($this->delayMs() * 1000);
                }
            }

            $tally[$verdict]++;

            // Reported for every title, including the ones already known. A
            // resumed run is mostly those, and staying silent through them made
            // a working sync look like a hung one.
            if ($progress) {
                $progress($row, $verdict, $reason);
            }
        }

        return $tally;
    }

    /**
     * A title we already know. No detail request — the listing already told us
     * everything that can change.
     *
     * @return array{0:string,1:?string}
     */
    protected function refresh(GameStoreLink $link, array $row): array
    {
        $link->forceFill(['last_synced_at' => now()])->save();

        // A listing rejected on its merits stays rejected. Re-deciding would
        // mean fetching it again to reach the same answer.
        if ($link->game_id === null) {
            return ['unchanged', null];
        }

        $game = $link->game;

        if (! $game) {
            return ['unchanged', null];
        }

        $date = $row['anchor']?->toDateString();
        $locked = (array) ($game->locked_fields ?? []);

        // An editor who fixed this date outranks the store that got it wrong.
        if (in_array('released', $locked, true)) {
            return ['unchanged', null];
        }

        // released is cast to a date, so it stringifies with a time component.
        // Comparing that against a plain date never matched, which made every
        // sync call every game delayed and rewrite it for nothing.
        $current = $game->released?->toDateString();

        if ($date === null || ($current === $date && $game->release_precision === $row['precision'])) {
            return ['unchanged', null];
        }

        $game->forceFill([
            'released' => $date,
            'release_precision' => $row['precision'],
        ])->save();

        return ['updated', null];
    }

    /**
     * A title we have never seen. For stores that charge a request per title,
     * this is the one time it costs one.
     *
     * @return array{0:string,1:?string} the verdict, and why it was refused
     */
    protected function ingest(array $row): array
    {
        try {
            $details = $this->details($row);
        } catch (TransientFailure $e) {
            // Recording this would blacklist a game we simply failed to reach.
            // Leaving no trace means the next run tries it again.
            Log::info('title deferred', [
                'store' => $this->store(),
                'store_id' => $row['store_id'],
                'why' => $e->getMessage(),
            ]);

            return ['skipped', 'store unreachable'];
        }

        if ($details === null) {
            $this->remember($row, self::UNREACHABLE);

            return ['rejected', self::UNREACHABLE];
        }

        if ($reason = $this->filter->reject($details, $this->store())) {
            $this->remember($row, $reason);

            return ['rejected', $reason];
        }

        $game = $this->createGame($row, $details);

        GameStoreLink::create([
            'game_id' => $game->id,
            'store' => $this->store(),
            'store_id' => $row['store_id'],
            'url' => $details['url'] ?? null,
            'payload' => $details,
            'last_synced_at' => now(),
        ]);

        return ['created', null];
    }

    /**
     * Ask the store again about a game we already have, and take only what it
     * says about how the game looks.
     *
     * Deliberately narrow. Dates, identity, store links and merges are left
     * exactly as they are, so this can be run to repair a field we once read
     * from the wrong key without any risk of undoing an editor's ruling or
     * pulling a merged entry back apart.
     *
     * @throws TransientFailure
     */
    public function refreshPresentation(GameStoreLink $link): bool
    {
        $game = $link->game;

        if (! $game) {
            return false;
        }

        $details = $this->details([
            'store_id' => $link->store_id,
            'title' => $game->name,
            'anchor' => $game->released,
            'precision' => $game->release_precision,
        ]);

        if ($details === null) {
            return false;
        }

        $locked = (array) ($game->locked_fields ?? []);

        $fields = array_filter([
            'cover_url' => $details['hero'] ?? null,
            'screenshots' => $details['screenshot_urls'] ?? null,
            'videos' => $details['trailer_urls'] ?? null,
            'genres' => $details['genres'] ?? null,
        ], fn ($value, $key) => $value !== null && ! in_array($key, $locked, true), ARRAY_FILTER_USE_BOTH);

        // A store that has since gone quiet must not blank what we already show.
        $fields = array_filter($fields, fn ($value) => ! (is_array($value) && $value === []));

        if ($fields === []) {
            return false;
        }

        $game->forceFill($fields)->save();

        $link->forceFill(['payload' => $details, 'last_synced_at' => now()])->save();

        return true;
    }

    protected function createGame(array $row, array $details): Game
    {
        $title = $details['title'] ?: $row['title'];

        return Game::create([
            'slug' => $this->uniqueSlug($title),
            'name' => $title,
            'match_key' => $this->normalizer->key($title),
            'released' => $row['anchor']?->toDateString(),
            'release_precision' => $row['precision'],
            'cover_url' => $details['hero'] ?? null,
            'genres' => $details['genres'] ?? [],
            'platforms' => $this->platformNames($row, $details),
            'screenshots' => $details['screenshot_urls'] ?? [],
            'videos' => $details['trailer_urls'] ?? [],
            'description' => $details['description'] ?? null,
            'developers' => array_values(array_filter([$details['developer'] ?? null])),
            'publishers' => array_values(array_filter([$details['publisher'] ?? null])),
        ]);
    }

    /**
     * A listing that will never be a calendar entry still earns a row, so the
     * next sync knows not to ask about it again.
     */
    protected function remember(array $row, string $reason): void
    {
        GameStoreLink::create([
            'game_id' => null,
            'store' => $this->store(),
            'store_id' => $row['store_id'],
            'url' => $row['url'] ?? null,
            'rejected_reason' => Str::limit($reason, 78, ''),
            'last_synced_at' => now(),
        ]);
    }

    /** @return array{0:Carbon,1:Carbon} */
    public function window(?Carbon $from, ?Carbon $to): array
    {
        $from ??= now()->startOfMonth();
        $to ??= $from->copy()->addMonths(config('releases.window_months') - 1)->endOfMonth();

        return [$from->copy()->startOfDay(), $to->copy()->endOfDay()];
    }

    protected function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'game';
        $slug = $base;
        $n = 2;

        while (Game::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
