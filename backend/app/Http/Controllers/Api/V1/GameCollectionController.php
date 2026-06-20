<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\QuestService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $game = Game::where('slug', $slug)->firstOrFail();

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
        $game = Game::where('slug', $slug)->firstOrFail();

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
        if ($entry->status === 'completed') {
            $entry->completed_at = $entry->completed_at ?? now();
            if (! $request->filled('progress')) {
                $entry->progress = 100;
            }
        }

        $wasNew = ! $entry->exists;
        $entry->save();
        $entry->load(['game:id,slug,name,released,rating,background_image,platform_names,genre_names']);

        // Trigger achievement checks after collection change (fire-and-forget)
        try {
            $types = ['games_added', 'games_completed', 'games_playing', 'games_wishlisted'];
            app(AchievementService::class)->check($request->user(), $types);
        } catch (\Throwable) {
        }

        // Bounty bonus for completing a game + quest progress
        if ($data['status'] === 'completed') {
            try {
                $wasAlreadyCompleted = ! $wasNew && $entry->getOriginal('status') === 'completed';
                if (! $wasAlreadyCompleted) {
                    app(BountyService::class)->award($request->user(), 50, "Game completed: {$game->name}", 'milestone');
                    app(QuestService::class)->progress($request->user(), 'game_completed', 1);
                }
            } catch (\Throwable) {
            }
        }

        // Quest: game added to collection
        if ($wasNew) {
            try {
                app(QuestService::class)->progress($request->user(), 'game_added', 1);
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
     * Auth: remove a game from the current user's collection.
     * DELETE /collection/games/{slug}
     */
    public function destroy(Request $request, string $slug)
    {
        $game = Game::where('slug', $slug)->firstOrFail();

        UserGame::where('user_id', $request->user()->id)
            ->where('game_id', $game->id)
            ->delete();

        return $this->success(null, 'Removed from collection');
    }

    private function present(UserGame $ug): array
    {
        $game = $ug->game;

        return [
            'id' => $ug->id,
            'status' => $ug->status,
            'is_favorite' => $ug->is_favorite,
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
