<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\User;
use App\Services\AchievementService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The achievements page: the whole catalog with, for one user, what's
 * unlocked, how far along the rest are, and how rare each one is.
 */
class AchievementController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * Rarity is meaningless on a small base — "unlocked by 95% of players"
     * reads as a real statistic when it's really nineteen people out of twenty.
     * Below this many achievers, we show the category and say nothing about
     * rarity at all.
     */
    private const RARITY_MIN_POPULATION = 50;

    /** criteria_type → the section of the catalog it belongs to. */
    private const CATEGORIES = [
        'email_verified' => 'Account',
        'gamertags' => 'Platform',
        'pc_specs' => 'Platform',
        'discord' => 'Platform',
        'connected_accounts' => 'Platform',
        'collection_platforms' => 'Platform',
        'early_adopter' => 'Account',

        'games_added' => 'Collection',
        'games_playing' => 'Collection',
        'games_wishlisted' => 'Collection',
        'games_completed' => 'Collection',
        'backlog_completed' => 'Collection',
        'ratings_count' => 'Reviews',

        'posts_count' => 'Forum',
        'threads_count' => 'Forum',
        'long_posts' => 'Forum',
        'solutions_count' => 'Community',
        'comments_count' => 'Community',
        'comment_likes_received' => 'Community',
        'thread_upvotes_received' => 'Community',
        'reputation' => 'Community',

        'xp' => 'Progression',
        'daily_streak' => 'Activity',
        'active_days' => 'Activity',
        'achievements_count' => 'Progression',

        'friends_count' => 'Social',
        'special' => 'Social',

        'orders_count' => 'Shop',
        'support_tier' => 'Shop',
        'support_duration' => 'Shop',
    ];

    /**
     * GET /users/{username}/achievements
     */
    public function index(string $username, AchievementService $achievements): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $all = Cache::remember('achievements.catalog.v2', 3600, fn () => Achievement::all());

        $unlocked = $user->achievements()
            ->get(['achievements.id'])
            ->mapWithKeys(fn ($a) => [$a->id => $a->pivot->unlocked_at]);

        // A hidden achievement is a surprise until it lands — then it belongs
        // on the shelf like any other.
        $catalog = $all->filter(fn (Achievement $a) => ! $a->is_hidden || $unlocked->has($a->id))->values();

        // One pass over the criteria types actually present, not one query per
        // achievement — most types cover several rungs of the same ladder.
        $values = $achievements->currentValues($user, $catalog->pluck('criteria_type')->all());
        $rarity = $this->rarity();

        $items = $catalog->map(function (Achievement $a) use ($unlocked, $values, $rarity) {
            $isUnlocked = $unlocked->has($a->id);
            $target = max(1, (int) $a->criteria_value);

            // A manual-grant achievement has nothing to measure against.
            $measurable = $a->criteria_type !== 'special' && array_key_exists($a->criteria_type, $values);
            $current = $measurable ? min($values[$a->criteria_type], $target) : null;

            return [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'icon_path' => $a->icon_path,
                'points' => (int) $a->points,
                'category' => self::CATEGORIES[$a->criteria_type] ?? 'Other',
                'criteria_type' => $a->criteria_type,
                'criteria_value' => $target,
                'is_unlocked' => $isUnlocked,
                'unlocked_at' => $unlocked->get($a->id),
                'current' => $isUnlocked ? $target : $current,
                'percent' => $isUnlocked ? 100 : ($current !== null ? (int) round(($current / $target) * 100) : null),
                // null when the population is too small to say anything honest
                'rarity_percent' => $rarity[$a->id] ?? null,
                'rarity' => isset($rarity[$a->id]) ? $this->tier($rarity[$a->id]) : null,
            ];
        })->values();

        return $this->success([
            'items' => $items,
            'score' => (int) $all->whereIn('id', $unlocked->keys())->sum('points'),
            'unlocked_count' => $unlocked->count(),
            'total' => $catalog->count(),
            'rarity_available' => $rarity !== [],
        ]);
    }

    /**
     * What share of achievers holds each achievement, cached for an hour.
     * Returns an empty map below the honesty threshold.
     *
     * @return array<int,int>
     */
    private function rarity(): array
    {
        return Cache::remember('achievements.rarity.v1', 3600, function () {
            $population = (int) DB::table('user_achievements')->distinct()->count('user_id');

            if ($population < self::RARITY_MIN_POPULATION) {
                return [];
            }

            return DB::table('user_achievements')
                ->select('achievement_id', DB::raw('count(distinct user_id) as holders'))
                ->groupBy('achievement_id')
                ->pluck('holders', 'achievement_id')
                ->map(fn ($holders) => max(1, (int) round(($holders / $population) * 100)))
                ->all();
        });
    }

    /** The three bands every game uses, drawn at the usual places. */
    private function tier(int $percent): string
    {
        if ($percent <= 15) {
            return 'epic';
        }

        return $percent <= 40 ? 'rare' : 'common';
    }
}
