<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameExternalId;
use App\Models\User;
use App\Models\UserGame;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\GameMatchingService;
use App\Services\QuestService;
use App\Services\RawgService;
use App\Services\XpService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;

class GameCollectionController extends Controller
{
    use ApiResponse;

    /**
     * Public: list a user's game collection, optionally filtered by status / favorites.
     * GET /users/{username}/collection?status=playing&favorite=1
     */
    public function index(Request $request, string $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $status = $request->query('status');
        $favorite = $request->boolean('favorite');
        $pageSize = min(60, max(10, (int) $request->query('page_size', 24)));

        $q = UserGame::query()
            ->where('user_id', $user->id)
            ->when($status && in_array($status, UserGame::STATUSES), fn ($q) => $q->where('status', $status))
            ->when($favorite, fn ($q) => $q->where('is_favorite', true))
            ->with(['game:id,slug,name,released,rating,background_image,platform_names,genre_names'])
            ->orderByDesc('updated_at');

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
            ->with(['game:id,slug,name,released,rating,background_image,platform_names,genre_names'])
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

        // Game not in local DB — fetch minimal data from RAWG and create it.
        // This is the only ingestion path for brand-new releases, so it stays,
        // but hardened: per-user creation limit + the RAWG result must really
        // be this slug (no fuzzy matches seeding junk rows).
        if (! $game) {
            $limiterKey = 'game-autocreate:'.$request->user()->id;
            if (! RateLimiter::attempt($limiterKey, 10, fn () => true, 3600)) {
                return $this->error('Too many new games added recently. Try again later.', 429);
            }

            try {
                $rawg = app(RawgService::class)->getGameDetails($slug);

                if (empty($rawg['name']) || ($rawg['slug'] ?? $slug) !== $slug) {
                    return $this->error('Game not found', 404);
                }

                $game = Game::create([
                    'slug' => $slug,
                    'name' => $rawg['name'],
                    'released' => $rawg['released'] ?? null,
                    'rating' => $rawg['rating'] ?? 0,
                    'background_image' => $rawg['background_image'] ?? null,
                    'details_crawled_at' => now(),
                ]);

                if (! empty($rawg['id'])) {
                    GameExternalId::firstOrCreate(
                        ['provider' => 'rawg', 'external_id' => (string) $rawg['id']],
                        ['game_id' => $game->id]
                    );
                }
            } catch (\Throwable) {
                return $this->error('Game not found', 404);
            }
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

        // Lifecycle timestamps
        if ($entry->status === 'playing' && ! $entry->started_at) {
            $entry->started_at = now();
        }
        if ($entry->status === 'playing') {
            $entry->last_played_at = now();
        }
        if ($entry->status === 'completed') {
            $entry->completed_at = $entry->completed_at ?? now();
            if (! $request->filled('progress')) {
                $entry->progress = 100;
            }
        }

        $wasNew = ! $entry->exists;
        // Capture BEFORE save() — save() syncs originals, which made the
        // completion bounty unreachable for status transitions
        $previousStatus = $wasNew ? null : $entry->getOriginal('status');
        $entry->save();
        $entry->load(['game:id,slug,name,released,rating,background_image,platform_names,genre_names']);

        // Trigger achievement checks after collection change (fire-and-forget)
        try {
            $types = ['games_added', 'games_completed', 'games_playing', 'games_wishlisted'];
            app(AchievementService::class)->check($request->user(), $types);
        } catch (\Throwable) {
        }

        // Bounty + XP bonus for completing a game + quest progress
        if ($data['status'] === 'completed' && $previousStatus !== 'completed') {
            try {
                app(BountyService::class)->award($request->user(), 50, "Game completed: {$game->name}", 'milestone');
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
            ->with(['game:id,slug,name,released,background_image'])
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
                'background_image' => $ug->game->background_image,
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
            $cols = str_getcsv($line);
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
            UserGame::where('user_id', $request->user()->id)
                ->where('game_id', $game->id)
                ->delete();
        }

        return $this->success(null, 'Removed from collection');
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
            'started_at' => $ug->started_at,
            'completed_at' => $ug->completed_at,
            'updated_at' => $ug->updated_at,
            'game' => $game ? [
                'id' => $game->id,
                'slug' => $game->slug,
                'name' => $game->name,
                'released' => $game->released?->format('Y-m-d'),
                'rating' => $game->rating,
                'background_image' => $game->background_image,
                'platform_names' => $game->platform_names ?? [],
                'genre_names' => $game->genre_names ?? [],
            ] : null,
        ];
    }
}
