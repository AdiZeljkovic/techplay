<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use App\Models\User;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GameListController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * Public: a user's public lists (preview with item count + cover collage).
     * GET /users/{username}/lists
     */
    public function index(string $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $lists = GameList::where('user_id', $user->id)
            ->where('is_public', true)
            ->withCount('items')
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,background_image')])
            ->latest()
            ->get();

        return $this->success($lists->map(fn ($l) => $this->presentList($l)));
    }

    /**
     * Auth: the current user's own lists (public + private).
     * GET /game-lists/mine
     */
    public function mine(Request $request)
    {
        $lists = GameList::where('user_id', $request->user()->id)
            ->withCount('items')
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,background_image')])
            ->latest()
            ->get();

        return $this->success($lists->map(fn ($l) => $this->presentList($l)));
    }

    /**
     * Public/owner: a single list with its games.
     * GET /game-lists/{id}
     */
    public function show(Request $request, int $id)
    {
        $list = GameList::with(['items.game:id,slug,name,released,rating,background_image,platform_names', 'user:id,username,display_name,avatar_url'])
            ->findOrFail($id);

        if (! $list->is_public && optional($request->user('sanctum'))->id !== $list->user_id) {
            return $this->forbidden('This list is private.');
        }

        return $this->success($this->presentList($list, true));
    }

    /**
     * Public: a single list by owner username + slug — the shareable URL.
     * GET /users/{username}/lists/{slug}
     */
    public function showBySlug(Request $request, string $username, string $slug)
    {
        $user = User::where('username', $username)->firstOrFail();

        $list = GameList::where('user_id', $user->id)
            ->where('slug', $slug)
            ->with(['items.game:id,slug,name,released,rating,background_image,platform_names', 'user:id,username,display_name,avatar_url'])
            ->firstOrFail();

        if (! $list->is_public && optional($request->user('sanctum'))->id !== $list->user_id) {
            return $this->forbidden('This list is private.');
        }

        // A friends-only profile locks its lists too — the profile-level
        // setting is the stronger intent.
        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        return $this->success($this->presentList($list, true));
    }

    /**
     * Auth: create a list.
     * POST /game-lists
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_public' => ['sometimes', 'boolean'],
        ]);

        $list = GameList::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($request->user()->id, $data['name']),
            'description' => $data['description'] ?? null,
            'is_public' => $data['is_public'] ?? true,
        ]);

        $list->loadCount('items');

        return $this->success($this->presentList($list), 'List created', 201);
    }

    /**
     * Auth: update a list.
     * PUT /game-lists/{id}
     */
    public function update(Request $request, int $id)
    {
        $list = GameList::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_public' => ['sometimes', 'boolean'],
        ]);

        $list->fill($data)->save();
        $list->loadCount('items');

        return $this->success($this->presentList($list), 'List updated');
    }

    /**
     * Auth: delete a list.
     * DELETE /game-lists/{id}
     */
    public function destroy(Request $request, int $id)
    {
        GameList::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return $this->success(null, 'List deleted');
    }

    /**
     * Auth: add a game to a list (by slug).
     * POST /game-lists/{id}/items
     */
    public function addItem(Request $request, int $id)
    {
        $list = GameList::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate(['slug' => ['required', 'string']]);

        $game = Game::where('slug', $data['slug'])->firstOrFail();

        $position = (int) GameListItem::where('game_list_id', $list->id)->max('position') + 1;

        GameListItem::firstOrCreate(
            ['game_list_id' => $list->id, 'game_id' => $game->id],
            ['position' => $position],
        );

        $list->load(['items.game:id,slug,name,released,rating,background_image,platform_names'])->loadCount('items');

        return $this->success($this->presentList($list, true), 'Added to list');
    }

    /**
     * Auth: remove an item from a list.
     * DELETE /game-lists/{id}/items/{itemId}
     */
    public function removeItem(Request $request, int $id, int $itemId)
    {
        $list = GameList::where('user_id', $request->user()->id)->findOrFail($id);
        GameListItem::where('game_list_id', $list->id)->where('id', $itemId)->delete();

        return $this->success(null, 'Removed from list');
    }

    /**
     * Auth: reorder list items.
     * PUT /game-lists/{id}/reorder  { item_ids: [...] }
     */
    public function reorder(Request $request, int $id)
    {
        $list = GameList::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate(['item_ids' => ['required', 'array'], 'item_ids.*' => ['integer']]);

        foreach ($data['item_ids'] as $pos => $itemId) {
            GameListItem::where('game_list_id', $list->id)->where('id', $itemId)->update(['position' => $pos]);
        }

        return $this->success(null, 'Reordered');
    }

    private function uniqueSlug(int $userId, string $name): string
    {
        $base = Str::slug($name) ?: 'list';
        $slug = $base;
        $i = 1;
        while (GameList::where('user_id', $userId)->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }

    private function presentList(GameList $list, bool $withItems = false): array
    {
        $covers = $list->relationLoaded('items')
            ? $list->items->map(fn ($it) => $it->game?->background_image)->filter()->take(4)->values()->all()
            : [];

        $data = [
            'id' => $list->id,
            'name' => $list->name,
            'slug' => $list->slug,
            'description' => $list->description,
            'is_public' => $list->is_public,
            'items_count' => $list->items_count ?? ($list->relationLoaded('items') ? $list->items->count() : 0),
            'covers' => $covers,
            'updated_at' => $list->updated_at,
        ];

        if ($list->relationLoaded('user') && $list->user) {
            $data['user'] = [
                'username' => $list->user->username,
                'display_name' => $list->user->display_name,
                'avatar_url' => $list->user->avatar_url,
            ];
        }

        if ($withItems && $list->relationLoaded('items')) {
            $data['items'] = $list->items->map(fn ($it) => [
                'id' => $it->id,
                'position' => $it->position,
                'game' => $it->game ? [
                    'slug' => $it->game->slug,
                    'name' => $it->game->name,
                    'released' => $it->game->released?->format('Y-m-d'),
                    'rating' => $it->game->rating,
                    'background_image' => $it->game->background_image,
                    'platform_names' => $it->game->platform_names ?? [],
                ] : null,
            ])->values()->all();
        }

        return $data;
    }
}
