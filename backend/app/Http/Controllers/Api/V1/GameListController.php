<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListComment;
use App\Models\GameListItem;
use App\Models\GameListLike;
use App\Models\User;
use App\Services\QuestService;
use App\Services\SanitizationService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            ->where('is_draft', false)
            ->withCount(['items', 'likes', 'comments'])
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,cover_url')])
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
            ->withCount(['items', 'likes', 'comments'])
            ->with(['items' => fn ($q) => $q->limit(4)->with('game:id,cover_url')])
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
        // profile_visibility must be in the select, or the privacy check below
        // reads a missing attribute and silently decides the profile is public.
        $list = GameList::with(['items.game:id,slug,name,released,rating,cover_url,platforms', 'user:id,username,display_name,avatar_url,profile_visibility'])
            ->withCount(['likes', 'comments'])
            ->findOrFail($id);

        $viewerId = optional($request->user('sanctum'))->id;

        // One message for both cases: distinguishing "draft" from "private"
        // from "no such id" let an anonymous scanner map which lists exist.
        if (! $list->isPublished() && $viewerId !== $list->user_id) {
            return $this->forbidden('This list is not available.');
        }

        // Published is published — see the note in showBySlug().
        $this->markLiked($list, $viewerId);

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
            ->with(['items.game:id,slug,name,released,rating,cover_url,platforms', 'user:id,username,display_name,avatar_url'])
            ->withCount(['likes', 'comments'])
            ->firstOrFail();

        $viewerId = optional($request->user('sanctum'))->id;

        if (! $list->isPublished() && $viewerId !== $list->user_id) {
            return $this->forbidden($list->is_draft ? 'This list is still a draft.' : 'This list is private.');
        }

        /*
         * A published list stays published, whatever the profile says.
         *
         * This used to refuse when the author's profile was friends-only, and
         * the reasoning — "the profile-level setting is the stronger intent" —
         * had it backwards. Profile visibility hides *aggregates*: the shelf,
         * the stats, the activity, the directory of somebody's lists. It has
         * never unpublished a forum post, a comment or a review, because those
         * were deliberately put on a public page.
         *
         * A list with `is_public` ticked and `is_draft` cleared is exactly
         * that deliberate act. XLBanana47 published one, opened it, and got an
         * error page — on a thing he had just chosen to share.
         *
         * What stays hidden is index(): "show me everything this person has
         * made" is the aggregate, and that is still refused.
         */
        $this->markLiked($list, $viewerId);

        return $this->success($this->presentList($list, true));
    }

    /**
     * Auth: create a list.
     * POST /game-lists
     */
    public function store(Request $request)
    {
        $data = $request->validate($this->listRules(true));

        $list = GameList::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($request->user()->id, $data['name']),
            'description' => $data['description'] ?? null,
            'is_public' => $data['is_public'] ?? true,
            'list_type' => $data['list_type'] ?? 'custom',
            'category' => $data['category'] ?? null,
            'tags' => $data['tags'] ?? null,
            'allow_comments' => $data['allow_comments'] ?? true,
            'has_spoilers' => $data['has_spoilers'] ?? false,
            'is_draft' => $data['is_draft'] ?? false,
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

        $data = $request->validate($this->listRules(false));

        $wasDraft = (bool) $list->is_draft;
        $list->fill($data)->save();
        $list->loadCount('items');

        // Publishing is the moment a list starts existing for other people —
        // which is why the quest counts that rather than creation. A draft is
        // a note to yourself.
        if ($wasDraft && ! $list->is_draft) {
            try {
                app(QuestService::class)->progress($request->user(), 'list_published');
            } catch (\Throwable) {
            }
        }

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

        // A Top 10 that holds eleven is not a Top 10.
        $limit = $list->itemLimit();
        if ($limit !== null && GameListItem::where('game_list_id', $list->id)->count() >= $limit) {
            return $this->error("A {$list->list_type} list holds {$limit} games — remove one first.", 422);
        }

        $position = (int) GameListItem::where('game_list_id', $list->id)->max('position') + 1;

        GameListItem::firstOrCreate(
            ['game_list_id' => $list->id, 'game_id' => $game->id],
            ['position' => $position],
        );

        $list->load(['items.game:id,slug,name,released,rating,cover_url,platforms'])->loadCount('items');

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
        $data = $request->validate([
            'item_ids' => ['required', 'array'],
            'item_ids.*' => ['integer'],
            // A tier board reorders one rung at a time, so the ids that arrive
            // are that rung's — and passing it also moves anything dragged in
            // from another rung in the same request.
            'tier' => ['sometimes', 'nullable', Rule::in(GameList::TIERS)],
        ]);

        $tier = $request->has('tier') ? $data['tier'] ?? null : false;

        foreach ($data['item_ids'] as $pos => $itemId) {
            $fields = ['position' => $pos];
            if ($tier !== false) {
                $fields['tier'] = $tier;
            }

            GameListItem::where('game_list_id', $list->id)->where('id', $itemId)->update($fields);
        }

        return $this->success(null, 'Reordered');
    }

    /**
     * Auth: the note and score that justify an item's rank.
     * PUT /game-lists/{id}/items/{itemId}
     */
    public function updateItem(Request $request, int $id, int $itemId)
    {
        $list = GameList::where('user_id', $request->user()->id)->findOrFail($id);
        $item = GameListItem::where('game_list_id', $list->id)->findOrFail($itemId);

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:300'],
            // 1.0–10.0 with one decimal — a ranking's own scale, deliberately
            // not the 1–5 stars used for official game ratings.
            'score' => ['nullable', 'numeric', 'min:1', 'max:10'],
            // Which rung, on a board that has rungs. Null puts it back in the
            // unranked tray, which is a real move and not a missing value.
            'tier' => ['sometimes', 'nullable', Rule::in(GameList::TIERS)],
        ]);

        if (array_key_exists('tier', $data) && ! $list->isTierList()) {
            return $this->error('Only a tier list has tiers.', 422);
        }

        // Landing on a rung means landing at the end of it, not on top of
        // whoever is already there.
        if (! empty($data['tier']) && $data['tier'] !== $item->tier) {
            $data['position'] = (int) GameListItem::where('game_list_id', $list->id)
                ->where('tier', $data['tier'])
                ->max('position') + 1;
        }

        $item->fill($data)->save();

        return $this->success(null, 'Item updated');
    }

    /**
     * Public: lists worth discovering — most liked first, then newest.
     * GET /game-lists/discover
     */
    public function discover(Request $request)
    {
        $limit = min(20, max(1, (int) $request->query('limit', 6)));

        $lists = GameList::query()
            ->where('is_public', true)
            ->where('is_draft', false)
            // A user who hid their profile still had every public list of
            // theirs surfaced here, with username and avatar attached.
            ->whereHas('user', fn ($q) => $q->where('profile_visibility', 'public'))
            ->has('items')
            ->withCount(['items', 'likes', 'comments'])
            ->with(['user:id,username,display_name,avatar_url', 'items' => fn ($q) => $q->limit(4)->with('game:id,cover_url')])
            ->orderByDesc('likes_count')
            ->latest()
            ->limit($limit)
            ->get();

        return $this->success($lists->map(fn ($l) => $this->presentList($l)));
    }

    /**
     * Auth: like or unlike a list — one call, it toggles.
     * POST /game-lists/{id}/like
     */
    public function toggleLike(Request $request, int $id)
    {
        $list = GameList::withCount('likes')->findOrFail($id);

        if (! $list->isPublished() && $list->user_id !== $request->user()->id) {
            return $this->forbidden('This list is not public.');
        }

        $existing = GameListLike::where('game_list_id', $list->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return $this->success(['liked' => false, 'likes_count' => max(0, $list->likes_count - 1)]);
        }

        GameListLike::create(['game_list_id' => $list->id, 'user_id' => $request->user()->id]);

        return $this->success(['liked' => true, 'likes_count' => $list->likes_count + 1]);
    }

    /**
     * Public: a list's comments, oldest first — a discussion reads forward.
     * GET /game-lists/{id}/comments
     */
    public function comments(Request $request, int $id)
    {
        $list = GameList::with('user:id,username,profile_visibility')->findOrFail($id);
        $viewerId = optional($request->user('sanctum'))->id;

        if (! $list->isPublished() && $viewerId !== $list->user_id) {
            return $this->forbidden('This list is not available.');
        }

        // Comments belong to the list, and the list is published.
        $comments = GameListComment::where('game_list_id', $list->id)
            ->with('user:id,username,display_name,avatar_url')
            ->oldest()
            ->limit(100)
            ->get()
            ->map(fn (GameListComment $c) => [
                'id' => $c->id,
                'body' => $c->body,
                'created_at' => $c->created_at,
                'user' => [
                    'username' => $c->user?->username,
                    'display_name' => $c->user?->display_name,
                    'avatar_url' => $c->user?->avatar_url,
                ],
            ]);

        return $this->success($comments);
    }

    /**
     * Auth: comment on a list. The author's `allow_comments` is the gate.
     * POST /game-lists/{id}/comments
     */
    public function addComment(Request $request, int $id)
    {
        $list = GameList::findOrFail($id);

        if (! $list->isPublished()) {
            return $this->forbidden('This list is not public.');
        }

        if (! $list->allow_comments) {
            return $this->forbidden('Comments are turned off for this list.');
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        $comment = GameListComment::create([
            'game_list_id' => $list->id,
            'user_id' => $request->user()->id,
            'body' => app(SanitizationService::class)->sanitizePlainText($data['body']),
        ]);

        $comment->load('user:id,username,display_name,avatar_url');

        return $this->success([
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => $comment->created_at,
            'user' => [
                'username' => $comment->user?->username,
                'display_name' => $comment->user?->display_name,
                'avatar_url' => $comment->user?->avatar_url,
            ],
        ], 'Comment posted', 201);
    }

    /**
     * Auth: delete your own comment — or any comment on your own list.
     * DELETE /game-lists/{id}/comments/{commentId}
     */
    public function deleteComment(Request $request, int $id, int $commentId)
    {
        $list = GameList::findOrFail($id);
        $comment = GameListComment::where('game_list_id', $list->id)->findOrFail($commentId);

        $userId = $request->user()->id;
        if ($comment->user_id !== $userId && $list->user_id !== $userId) {
            return $this->forbidden('Not yours to delete.');
        }

        $comment->delete();

        return $this->success(null, 'Comment removed');
    }

    /** Stamps the viewer's own like onto a loaded list, without a second query per list. */
    private function markLiked(GameList $list, ?int $viewerId): void
    {
        $list->liked_by_me = $viewerId !== null && GameListLike::where('game_list_id', $list->id)
            ->where('user_id', $viewerId)
            ->exists();
    }

    /**
     * Shared validation for create and update. `$creating` decides whether the
     * name is required — everything else is optional either way.
     */
    private function listRules(bool $creating): array
    {
        return [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_public' => ['sometimes', 'boolean'],
            'list_type' => ['sometimes', Rule::in(GameList::TYPES)],
            'category' => ['nullable', 'string', 'max:40'],
            'tags' => ['nullable', 'array', 'max:5'],
            'tags.*' => ['string', 'max:24'],
            'allow_comments' => ['sometimes', 'boolean'],
            'has_spoilers' => ['sometimes', 'boolean'],
            'is_draft' => ['sometimes', 'boolean'],
        ];
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
            ? $list->items->map(fn ($it) => $it->game?->cover_url)->filter()->take(4)->values()->all()
            : [];

        $data = [
            'id' => $list->id,
            'name' => $list->name,
            'slug' => $list->slug,
            'description' => $list->description,
            'is_public' => $list->is_public,
            'list_type' => $list->list_type,
            'item_limit' => $list->itemLimit(),
            'category' => $list->category,
            'tags' => $list->tags ?? [],
            'allow_comments' => $list->allow_comments,
            'has_spoilers' => $list->has_spoilers,
            'is_draft' => $list->is_draft,
            'items_count' => $list->items_count ?? ($list->relationLoaded('items') ? $list->items->count() : 0),
            'likes_count' => $list->likes_count ?? 0,
            'comments_count' => $list->comments_count ?? 0,
            'liked_by_me' => (bool) ($list->liked_by_me ?? false),
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
                'tier' => $it->tier,
                'note' => $it->note,
                'score' => $it->score !== null ? (float) $it->score : null,
                'game' => $it->game ? [
                    'slug' => $it->game->slug,
                    'name' => $it->game->name,
                    'released' => $it->game->released?->format('Y-m-d'),
                    'rating' => $it->game->rating,
                    'cover_url' => $it->game->cover_url,
                    'platforms' => $it->game->platforms ?? [],
                ] : null,
            ])->values()->all();
        }

        return $data;
    }
}
