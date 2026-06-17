<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Builds a unified activity feed for a user by merging recent rows from the
 * various activity sources (forum, games, achievements, rewards). Computed
 * on read — no separate activity log table to keep in sync.
 */
class ActivityService
{
    private const SOURCE_CAP = 40;

    /**
     * @return array{items: array<int,array>, total: int, page: int, per_page: int, last_page: int}
     */
    public function feed(User $user, ?string $category = null, int $page = 1, int $perPage = 15): array
    {
        $items = collect();

        if (! $category || $category === 'forum') {
            $items = $items->concat($this->threads($user))->concat($this->comments($user));
        }
        if (! $category || $category === 'games') {
            $items = $items->concat($this->games($user))->concat($this->lists($user));
        }
        if (! $category || $category === 'achievements') {
            $items = $items->concat($this->achievements($user));
        }
        if (! $category || $category === 'rewards') {
            $items = $items->concat($this->rewards($user))->concat($this->customizations($user));
        }

        $sorted = $items
            ->filter(fn ($i) => ! empty($i['created_at']))
            ->sortByDesc(fn ($i) => Carbon::parse($i['created_at'])->timestamp)
            ->values();

        $total = $sorted->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = max(1, min($page, $lastPage));
        $slice = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        return [
            'items' => $slice->all(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
        ];
    }

    private function threads(User $user): array
    {
        return DB::table('threads')
            ->where('author_id', $user->id)
            ->select('title', 'created_at')
            ->orderByDesc('created_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($t) => $this->item('forum', 'thread', "Started a discussion: {$t->title}", null, $t->created_at))
            ->all();
    }

    private function comments(User $user): array
    {
        return DB::table('comments')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->select('created_at')
            ->orderByDesc('created_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($c) => $this->item('forum', 'comment', 'Posted a comment', null, $c->created_at))
            ->all();
    }

    private function achievements(User $user): array
    {
        return DB::table('user_achievements')
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->where('user_achievements.user_id', $user->id)
            ->whereNotNull('user_achievements.unlocked_at')
            ->select('achievements.name', 'user_achievements.unlocked_at as created_at')
            ->orderByDesc('user_achievements.unlocked_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($a) => $this->item('achievements', 'achievement', "Unlocked achievement: {$a->name}", null, $a->created_at))
            ->all();
    }

    private function games(User $user): array
    {
        return DB::table('user_games')
            ->join('games', 'games.id', '=', 'user_games.game_id')
            ->where('user_games.user_id', $user->id)
            ->select('games.name', 'games.slug', 'user_games.status', 'user_games.updated_at as created_at')
            ->orderByDesc('user_games.updated_at')->limit(self::SOURCE_CAP)->get()
            ->map(function ($g) {
                $title = $g->status === 'completed'
                    ? "Completed {$g->name}"
                    : ($g->status === 'wishlist'
                        ? "Wishlisted {$g->name}"
                        : "Added {$g->name} to ".ucfirst($g->status));

                return $this->item('games', 'game', $title, "/games/{$g->slug}", $g->created_at);
            })
            ->all();
    }

    private function lists(User $user): array
    {
        return DB::table('game_lists')
            ->where('user_id', $user->id)
            ->select('name', 'created_at')
            ->orderByDesc('created_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($l) => $this->item('games', 'list', "Created list: {$l->name}", null, $l->created_at))
            ->all();
    }

    private function rewards(User $user): array
    {
        return DB::table('reward_redemptions')
            ->join('reward_items', 'reward_items.id', '=', 'reward_redemptions.reward_item_id')
            ->where('reward_redemptions.user_id', $user->id)
            ->select('reward_items.name', 'reward_redemptions.created_at')
            ->orderByDesc('reward_redemptions.created_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($r) => $this->item('rewards', 'reward', "Redeemed: {$r->name}", null, $r->created_at))
            ->all();
    }

    private function customizations(User $user): array
    {
        return DB::table('user_customizations')
            ->join('customizations', 'customizations.id', '=', 'user_customizations.customization_id')
            ->where('user_customizations.user_id', $user->id)
            ->select('customizations.name', 'user_customizations.created_at')
            ->orderByDesc('user_customizations.created_at')->limit(self::SOURCE_CAP)->get()
            ->map(fn ($c) => $this->item('rewards', 'customization', "Unlocked: {$c->name}", null, $c->created_at))
            ->all();
    }

    private function item(string $category, string $type, string $title, ?string $url, $createdAt): array
    {
        return [
            'category' => $category,
            'type' => $type,
            'title' => $title,
            'url' => $url,
            'created_at' => $createdAt ? Carbon::parse($createdAt)->toIso8601String() : null,
        ];
    }
}
