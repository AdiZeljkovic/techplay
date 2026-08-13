<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CollectionGoal;
use App\Models\User;
use App\Models\UserGame;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Collection goals: a target you set, measured live against the shelf.
 *
 * Progress is never stored. Every figure below is read from the collection at
 * request time, so a goal cannot drift out of sync with the thing it measures
 * — no counters to keep, nothing to backfill, and deleting a game moves the
 * bar the same instant.
 */
class CollectionGoalController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /** Sensible starting targets, offered when a user has set none. */
    private const DEFAULTS = [
        'complete_games' => 10,
        'unlock_achievements' => 25,
        'shrink_backlog' => 10,
    ];

    private const LABELS = [
        'complete_games' => 'Finish %d games',
        'unlock_achievements' => 'Unlock %d achievements',
        'shrink_backlog' => 'Get the backlog under %d',
    ];

    /**
     * GET /users/{username}/collection-goals
     */
    public function index(string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $targets = CollectionGoal::where('user_id', $user->id)->pluck('target', 'type');

        // The three live figures, one query each and only when needed.
        $completed = fn () => UserGame::where('user_id', $user->id)->where('status', 'completed')->count();
        $backlog = fn () => UserGame::where('user_id', $user->id)->where('status', 'backlog')->count();
        $achievements = fn () => $user->achievements()->count();
        $library = fn () => UserGame::where('user_id', $user->id)->count();

        $goals = [];
        foreach (CollectionGoal::TYPES as $type) {
            $target = (int) ($targets[$type] ?? self::DEFAULTS[$type]);

            // shrink_backlog counts *down* — done when you're at or under it,
            // so its bar fills as the pile shrinks rather than as it grows.
            if ($type === 'shrink_backlog') {
                $current = $backlog();

                // An empty shelf is not a conquered backlog. This read
                // "Get the backlog under 10 — done" to anyone who had never
                // added a game, which is the first thing a new account sees.
                if ($library() === 0) {
                    $percent = 0;
                } else {
                    $start = max($current, $target + 1);
                    $percent = $current <= $target ? 100 : (int) round((($start - $current) / max(1, $start - $target)) * 100);
                }
            } else {
                $current = $type === 'complete_games' ? $completed() : $achievements();
                $percent = $target > 0 ? min(100, (int) round(($current / $target) * 100)) : 0;
            }

            $goals[] = [
                'type' => $type,
                'label' => sprintf(self::LABELS[$type], $target),
                'target' => $target,
                'current' => $current,
                'percent' => $percent,
                'done' => $percent >= 100,
                'is_default' => ! $targets->has($type),
            ];
        }

        return $this->success($goals);
    }

    /**
     * PUT /me/collection-goals — set or clear targets, one call for all three.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'goals' => 'required|array|max:'.count(CollectionGoal::TYPES),
            'goals.*.type' => ['required', Rule::in(CollectionGoal::TYPES)],
            'goals.*.target' => 'required|integer|min:1|max:10000',
        ]);

        $userId = Auth::id();

        foreach ($data['goals'] as $goal) {
            CollectionGoal::updateOrCreate(
                ['user_id' => $userId, 'type' => $goal['type']],
                ['target' => $goal['target']],
            );
        }

        return $this->success(null, 'Goals updated');
    }
}
