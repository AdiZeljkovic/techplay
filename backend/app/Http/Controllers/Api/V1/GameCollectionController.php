<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\Chronicle\TasteProfileService;
use App\Services\GameMatchingService;
use App\Services\QuestService;
use App\Services\XpService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class GameCollectionController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * Public: list a user's game collection, optionally filtered by status / favorites.
     * GET /users/{username}/collection?status=playing&favorite=1
     */
    public function index(Request $request, string $username)
    {
        $user = User::byUsername($username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $status = $request->query('status');
        $favorite = $request->boolean('favorite');
        $pageSize = min(60, max(10, (int) $request->query('page_size', 24)));
        $search = trim((string) $request->query('search', ''));

        $q = UserGame::query()
            ->where('user_id', $user->id)
            /*
             * Asking for "playing" gets replays too.
             *
             * A replay is playing, and every count of playing on the site says
             * so — the stats strip, the snapshot tile, the achievement tally.
             * A filter that disagreed would make the tile read 5 and the list
             * show 4, which reads as a bug in the count rather than a
             * definition. Asking for "replaying" still narrows to those alone.
             */
            ->when(
                $status && in_array($status, UserGame::STATUSES),
                fn ($q) => $status === 'playing'
                    ? $q->whereIn('status', UserGame::ACTIVE)
                    : $q->where('status', $status)
            )
            ->when($favorite, fn ($q) => $q->where('is_favorite', true))
            // A shelf you cannot search is fine at twenty games and useless at
            // four hundred, which is what one Steam import produces.
            ->when($search !== '', fn ($q) => $q->whereHas(
                'game',
                fn ($g) => $g->where('name', 'ilike', '%'.str_replace('%', '\%', $search).'%')
            ))
            ->with(['game:id,slug,name,released,rating,cover_url,platforms,genres']);

        $this->applySort($q, (string) $request->query('sort', 'recent'));

        $items = $q->paginate($pageSize);

        $items->getCollection()->transform(fn (UserGame $ug) => $this->present($ug));

        return $this->paginated($items);
    }

    /**
     * Auth: the current user's collection entry for a game (or null).
     * GET /collection/games/{slug}
     */
    public function show(Request $request, string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        // Game not yet in local DB — user hasn't tracked it
        if (! $game) {
            return $this->success(null);
        }

        $entry = UserGame::where('user_id', $request->user()->id)
            ->where('game_id', $game->id)
            ->with(['game:id,slug,name,released,rating,cover_url,platforms,genres'])
            ->first();

        return $this->success($entry ? $this->present($entry) : null);
    }

    /**
     * Auth: add or update the current user's collection entry for a game.
     * PUT /collection/games/{slug}
     */
    public function upsert(Request $request, string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        // The catalogue is the catalogue. RAWG used to be asked to conjure a
        // row for unknown slugs; with it retired, a slug we do not have is a
        // 404 — new titles arrive through the store aggregator, not through
        // whatever a client typed into a URL.
        if (! $game) {
            return $this->error('Game not found', 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(UserGame::STATUSES)],
            'is_favorite' => ['sometimes', 'boolean'],
            'progress' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'hours_played' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'platform' => ['sometimes', 'nullable', 'string', 'max:60'],
        ]);

        $entry = UserGame::firstOrNew([
            'user_id' => $request->user()->id,
            'game_id' => $game->id,
        ]);

        $entry->fill($data);

        $wasNew = ! $entry->exists;
        // Capture BEFORE save() — save() syncs originals, which made the
        // completion bounty unreachable for status transitions
        $previousStatus = $wasNew ? null : $entry->getOriginal('status');

        // Lifecycle timestamps
        if (in_array($entry->status, UserGame::ACTIVE, true) && ! $entry->started_at) {
            $entry->started_at = now();
        }
        if (in_array($entry->status, UserGame::ACTIVE, true)) {
            $entry->last_played_at = now();
        }

        /*
         * Starting a replay is not un-finishing the game.
         *
         * `completed_at` stays where it was — it is the day this was first
         * finished, and a replay does not undo that. `progress` does go back
         * to zero: it describes the run in progress, and a replay that opens
         * at 100% would have nowhere to go.
         */
        if ($entry->status === 'replaying' && $previousStatus !== 'replaying') {
            $entry->progress = $request->filled('progress') ? $entry->progress : 0;
        }

        if ($entry->status === 'completed') {
            $entry->completed_at = $entry->completed_at ?? now();
            if (! $request->filled('progress')) {
                $entry->progress = 100;
            }

            /*
             * The count only moves on the way in.
             *
             * Editing a finished entry — adding hours, changing the platform —
             * sends `status: completed` again, and counting those would turn a
             * single finish into however many times somebody touched the row.
             * A second lap is the transition from replaying (or from anything
             * else) into completed, and that is what this counts.
             */
            if ($previousStatus !== 'completed') {
                $entry->playthroughs = (int) $entry->playthroughs + 1;
            }
        }

        // The backlog line is scored separately from plain completions, so mark
        // the entry the moment it graduates from backlog to completed. Sticky:
        // once earned it stays, even if the status is later changed again.
        if ($entry->status === 'completed' && $previousStatus === 'backlog') {
            $entry->from_backlog = true;
        }

        $entry->save();
        $entry->load(['game:id,slug,name,released,rating,cover_url,platforms,genres']);

        // A shelf change is taste news — the chronicle relearns on next read.
        //
        // After the write, not before it. As the first statement it ran on
        // requests that then 404'd on an unknown slug or failed validation, and
        // forget() does not just clear a cache — it deletes the built row, so
        // every one of those threw away work that the next page load had to
        // redo from eleven queries.
        app(TasteProfileService::class)->forget($request->user());

        // Trigger achievement checks after collection change (fire-and-forget)
        try {
            $types = [
                'games_added', 'games_completed', 'games_playing', 'games_wishlisted',
                'collection_platforms', 'backlog_completed',
            ];
            app(AchievementService::class)->check($request->user(), $types);
        } catch (\Throwable) {
        }

        // Bounty + XP bonus for completing a game + quest progress.
        //
        // Gated on the ledger rather than on the status transition. The status
        // can be moved back and forth, and the entry can be deleted and
        // re-added, so "became completed" is not the same as "was completed for
        // the first time" — and the quest step and XP were riding along with
        // the bounty on every lap.
        $completionKey = "game_completed:{$game->id}";
        $firstCompletion = $data['status'] === 'completed'
            && $previousStatus !== 'completed'
            && ! app(BountyService::class)->alreadyAwarded($request->user(), $completionKey);

        if ($firstCompletion) {
            try {
                // Paid once per game, ever. The status can move backwards, so
                // this used to pay again on every return to `completed` — and
                // deleting the entry and re-adding it defeated any marker kept
                // on the row, which is why the key lives in the ledger.
                app(BountyService::class)->award(
                    $request->user(),
                    50,
                    "Game completed: {$game->name}",
                    'milestone',
                    reference: $completionKey,
                );
                app(QuestService::class)->progress($request->user(), 'game_completed', 1);
                app(XpService::class)->awardXp($request->user(), XpService::XP_GAME_COMPLETED, 'game_completed');
            } catch (\Throwable) {
            }
        }

        // Quest + XP: game added to collection (XP once per game per user)
        if ($wasNew) {
            try {
                app(QuestService::class)->progress($request->user(), 'game_added', 1);

                $xpOnceKey = "user:{$request->user()->id}:xp_game_added:{$game->id}";
                if (! Cache::has($xpOnceKey)) {
                    Cache::put($xpOnceKey, 1, now()->addDays(30));
                    app(XpService::class)->awardXp($request->user(), XpService::XP_GAME_ADDED, 'game_added');
                }
            } catch (\Throwable) {
            }
        }

        return $this->success(
            $this->present($entry),
            $wasNew ? 'Added to collection' : 'Collection updated',
            $wasNew ? 201 : 200
        );
    }

    /**
     * Auth: lightweight slug→status map for the authenticated user's full library.
     * GET /collection/index — used by frontend to show "In Library" badges everywhere.
     */
    public function libraryIndex(Request $request): JsonResponse
    {
        $map = UserGame::where('user_id', Auth::id())
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->pluck('user_games.status', 'games.slug');

        return $this->success($map);
    }

    /**
     * Auth: upcoming releases from the user's wishlist/backlog (next 180 days).
     * GET /collection/upcoming
     */
    public function upcoming(Request $request): JsonResponse
    {
        $items = UserGame::where('user_id', Auth::id())
            ->whereIn('status', ['wishlist', 'backlog'])
            ->with(['game:id,slug,name,released,cover_url'])
            ->whereHas('game', function ($q) {
                $q->whereNotNull('released')
                    ->whereDate('released', '>', now())
                    ->whereDate('released', '<', now()->addDays(180));
            })
            ->get()
            ->map(fn (UserGame $ug) => [
                'slug' => $ug->game->slug,
                'name' => $ug->game->name,
                'released' => $ug->game->released?->format('Y-m-d'),
                'cover_url' => $ug->game->cover_url,
                'status' => $ug->status,
            ])
            ->sortBy('released')
            ->values()
            ->take(10);

        return $this->success($items);
    }

    /**
     * Auth: import a collection from a CSV file (name,status,hours_played).
     * Matches by title via GameMatchingService — works with Backloggd/HowLongToBeat
     * style exports. Max 500 rows per upload.
     * POST /collection/import
     */
    public function import(Request $request, GameMatchingService $matcher)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:1024',
        ]);

        $lines = preg_split('/\r\n|\r|\n/', (string) file_get_contents($request->file('file')->getRealPath()));
        $lines = array_slice(array_filter($lines, fn ($l) => trim($l) !== ''), 0, 501);

        $imported = 0;
        $skipped = [];

        foreach ($lines as $i => $line) {
            // Explicit $escape: PHP 8.4 changes the default and warns without it.
            $cols = str_getcsv($line, ',', '"', '\\');
            $name = trim((string) ($cols[0] ?? ''));

            // Skip an obvious header row
            if ($i === 0 && in_array(strtolower($name), ['name', 'title', 'game'], true)) {
                continue;
            }
            if ($name === '') {
                continue;
            }

            $game = $matcher->matchByName($name);
            if (! $game) {
                $skipped[] = $name;

                continue;
            }

            $status = strtolower(trim((string) ($cols[1] ?? '')));
            if (! in_array($status, UserGame::STATUSES, true)) {
                $status = 'backlog';
            }

            $entry = UserGame::firstOrNew([
                'user_id' => $request->user()->id,
                'game_id' => $game->id,
            ]);

            // Never downgrade data the user already curated by hand
            if (! $entry->exists) {
                $entry->status = $status;
            }
            $hours = (int) ($cols[2] ?? 0);
            if ($hours > 0 && $hours > (int) $entry->hours_played) {
                $entry->hours_played = min($hours, 100000);
            }
            if ($entry->status === 'completed' && ! $entry->completed_at) {
                $entry->completed_at = now();
                // An imported finish is still a finish. Guarded on the stamp
                // rather than the status so re-importing the same file does
                // not keep adding laps to rows that already have one.
                $entry->playthroughs = max(1, (int) $entry->playthroughs);
            }

            $entry->save();
            $imported++;
        }

        try {
            app(AchievementService::class)->check($request->user(), ['games_added', 'games_completed']);
        } catch (\Throwable) {
        }

        return $this->success([
            'imported' => $imported,
            'skipped_count' => count($skipped),
            'skipped' => array_slice($skipped, 0, 20),
        ], "Imported {$imported} games".(count($skipped) > 0 ? ', '.count($skipped).' not matched' : ''));
    }

    /**
     * Auth: pin/unpin a collection game to the profile showcase (max 4).
     * POST /collection/games/{slug}/showcase
     */
    public function toggleShowcase(Request $request, string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return $this->error('Game not found', 404);
        }

        $entry = UserGame::where('user_id', $request->user()->id)
            ->where('game_id', $game->id)
            ->first();

        if (! $entry) {
            return $this->error('Game is not in your collection', 404);
        }

        if ($entry->showcase_order !== null) {
            $entry->update(['showcase_order' => null]);

            return $this->success(['showcased' => false], 'Removed from showcase');
        }

        $count = UserGame::where('user_id', $request->user()->id)
            ->whereNotNull('showcase_order')
            ->count();

        if ($count >= 4) {
            return $this->error('Showcase is full — unpin a game first (max 4).', 422);
        }

        $max = (int) UserGame::where('user_id', $request->user()->id)->max('showcase_order');
        $entry->update(['showcase_order' => $max + 1]);

        return $this->success(['showcased' => true], 'Pinned to your showcase');
    }

    /**
     * Auth: remove a game from the current user's collection.
     * DELETE /collection/games/{slug}
     */
    public function destroy(Request $request, string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        if ($game) {
            $removed = UserGame::where('user_id', $request->user()->id)
                ->where('game_id', $game->id)
                ->delete();

            // Taking a game off the shelf says as much about taste as putting
            // one on it. Only upsert invalidated the chronicle, so removals
            // kept steering recommendations until something else happened to
            // rebuild it.
            if ($removed > 0) {
                app(TasteProfileService::class)->forget($request->user());
            }
        }

        return $this->success(null, 'Removed from collection');
    }

    /**
     * Order the shelf.
     *
     * Only 'added' existed, and only because the Recently Added rail needed
     * it — every other view got "whatever you touched last", which is the one
     * order a person can neither predict nor ask for. The four that sort on
     * the game rather than the entry join rather than use whereHas, because a
     * subquery cannot be ordered by.
     */
    private function applySort($q, string $sort): void
    {
        $joined = fn () => $q->leftJoin('games', 'games.id', '=', 'user_games.game_id')
            ->select('user_games.*');

        match ($sort) {
            'added' => $q->orderByDesc('user_games.created_at'),
            'hours' => $q->orderByDesc('user_games.hours_played')->orderByDesc('user_games.updated_at'),
            'name' => $joined()->orderBy('games.name'),
            'rating' => $joined()->orderByRaw('games.rating DESC NULLS LAST'),
            'released' => $joined()->orderByRaw('games.released DESC NULLS LAST'),
            default => $q->orderByDesc('user_games.updated_at'),
        };
    }

    private function present(UserGame $ug): array
    {
        $game = $ug->game;

        return [
            'id' => $ug->id,
            'status' => $ug->status,
            'is_favorite' => $ug->is_favorite,
            'showcase_order' => $ug->showcase_order,
            'progress' => $ug->progress,
            'hours_played' => $ug->hours_played,
            'platform' => $ug->platform,
            // Which stores reported this game, as opposed to the reader's own
            // word for where they play it. The card's marks are provenance, so
            // they read this — `platform` was set by whichever importer got
            // there first and never revisited, which is how 243 hours of
            // Morrowind came to sit under an Xbox mark.
            'sources' => $ug->sources ?? [],
            'started_at' => $ug->started_at,
            'completed_at' => $ug->completed_at,
            // How many times it has been finished. The shelf says "playing
            // again"; this is what makes it the second or the eighth time.
            'playthroughs' => (int) $ug->playthroughs,
            // when it entered the shelf, distinct from the last edit — the
            // "Recently added" rail needs the former
            'added_at' => $ug->created_at,
            'updated_at' => $ug->updated_at,
            'game' => $game ? [
                'id' => $game->id,
                'slug' => $game->slug,
                'name' => $game->name,
                'released' => $game->released?->format('Y-m-d'),
                'rating' => $game->rating,
                'cover_url' => $game->cover_url,
                'platforms' => $game->platforms ?? [],
                'genres' => $game->genres ?? [],
            ] : null,
        ];
    }
}
