<?php

namespace App\Services\Releases;

use App\Models\Game;
use App\Models\GameStoreLink;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Brings Steam's upcoming catalogue into our own tables.
 *
 * The shape of this is the whole point of the aggregator: a title costs a
 * detail request exactly once in its life. After that it is a known store id,
 * and the listing alone — one request per hundred titles — is enough to keep
 * its date honest. Delays are the only thing about an unreleased game that
 * actually changes, and the listing reports them for free.
 *
 * Rejections are remembered too. Half of Steam's upcoming catalogue fails the
 * quality gate, and re-fetching all of it every month to reach the same verdict
 * would be the single most wasteful thing this could do.
 */
class SteamSync
{
    public const STORE = 'steam';

    /**
     * The marker for "the store could not answer about this one". Deliberately
     * the same string the first release wrote, so the 115 titles it lost to
     * throttling are picked back up on the next run rather than staying lost.
     */
    public const UNREACHABLE = 'unavailable';

    public function __construct(
        private SteamCatalog $catalog,
        private QualityFilter $filter,
        private TitleNormalizer $normalizer,
    ) {}

    /**
     * @param  ?\Closure  $onDiscovered  called once with the number of titles in
     *                                   the window, before any of them are handled
     * @param  ?\Closure  $progress  called for every title, whatever happens to it
     * @return array{seen:int,created:int,updated:int,rejected:int,unchanged:int}
     */
    public function run(
        ?Carbon $from = null,
        ?Carbon $to = null,
        ?\Closure $progress = null,
        ?\Closure $onDiscovered = null,
    ): array {
        [$from, $to] = $this->window($from, $to);

        $rows = $this->catalog->listWindow($from, $to);

        if ($onDiscovered) {
            $onDiscovered(count($rows));
        }

        $tally = ['seen' => count($rows), 'created' => 0, 'updated' => 0, 'rejected' => 0, 'unchanged' => 0, 'skipped' => 0];

        foreach ($rows as $row) {
            $link = GameStoreLink::where('store', self::STORE)
                ->where('store_id', $row['store_id'])
                ->first();

            // A store that could not answer last time gets another chance.
            // Only verdicts about the game itself are final.
            if ($link && $link->game_id === null && $link->rejected_reason === self::UNREACHABLE) {
                $link->delete();
                $link = null;
            }

            if ($link) {
                [$verdict, $reason] = $this->refresh($link, $row);
            } else {
                [$verdict, $reason] = $this->ingest($row);

                // Only a first encounter costs a request, so this is the only
                // place that needs to be polite about pacing.
                usleep(config('releases.delay_ms') * 1000);
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
     */
    private function refresh(GameStoreLink $link, array $row): array
    {
        $link->forceFill(['last_synced_at' => now()])->save();

        // A listing we rejected on its merits stays rejected. Re-deciding would
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
     * A title we have never seen. This is the one time it costs a request.
     *
     * @return array{0:string,1:?string} the verdict, and why it was refused
     */
    private function ingest(array $row): array
    {
        try {
            $details = $this->catalog->details($row['store_id']);
        } catch (TransientFailure $e) {
            // Recording this would blacklist a game we simply failed to reach.
            // Leaving no trace means the next run tries it again.
            Log::info('steam title deferred', ['store_id' => $row['store_id'], 'why' => $e->getMessage()]);

            return ['skipped', 'store unreachable'];
        }

        if ($details === null) {
            $this->remember($row, self::UNREACHABLE);

            return ['rejected', self::UNREACHABLE];
        }

        if ($reason = $this->filter->reject($details)) {
            $this->remember($row, $reason);

            return ['rejected', $reason];
        }

        $game = $this->createGame($row, $details);

        GameStoreLink::create([
            'game_id' => $game->id,
            'store' => self::STORE,
            'store_id' => $row['store_id'],
            'url' => $details['url'],
            'payload' => $details,
            'last_synced_at' => now(),
        ]);

        return ['created', null];
    }

    private function createGame(array $row, array $details): Game
    {
        $title = $details['title'] ?: $row['title'];

        return Game::create([
            'slug' => $this->uniqueSlug($title),
            'name' => $title,
            'match_key' => $this->normalizer->key($title),
            'released' => $row['anchor']?->toDateString(),
            'release_precision' => $row['precision'],
            'background_image' => $details['hero'] ?? $row['capsule'],
            'metacritic' => $details['metacritic'],
            'genre_names' => $details['genres'],
            'platform_names' => ['PC'],
            'screenshots_data' => $details['screenshot_urls'],
            'movies_data' => $details['trailer_urls'],
            'details_data' => [
                'description' => $details['description'],
                'developer' => $details['developer'],
                'publisher' => $details['publisher'],
            ],
            'has_description' => filled($details['description']),
        ]);
    }

    /**
     * A listing that will never be a calendar entry still earns a row, so the
     * next sync knows not to ask about it again.
     */
    private function remember(array $row, string $reason): void
    {
        GameStoreLink::create([
            'game_id' => null,
            'store' => self::STORE,
            'store_id' => $row['store_id'],
            'url' => "https://store.steampowered.com/app/{$row['store_id']}/",
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

    private function uniqueSlug(string $title): string
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
