<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Giveaway;
use App\Models\GiveawayEntry;
use App\Models\GiveawayTask;
use App\Models\GiveawayTaskCompletion;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GiveawayController extends Controller
{
    /**
     * List all public giveaways with filters (public)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Giveaway::query()
            ->where('is_public', true)
            ->with(['winner:id,username,avatar_url'])
            ->withCount('entries');

        // Filter by status
        $status = $request->input('status'); // 'active', 'ended', 'all'
        if ($status === 'active') {
            $query->active();
        } elseif ($status === 'ended') {
            $query->where('status', 'ended')->orWhere('ends_at', '<', now());
        }

        // The page offers these with counts beside them, so the list has to
        // be able to answer them rather than look like it can.
        foreach (['platform', 'prize_type', 'region', 'entry_type'] as $facet) {
            $query->when($request->filled($facet), fn ($q) => $q->where($facet, $request->input($facet)));
        }

        // Order by: active first, then by end date
        $query->orderByRaw("
            CASE
                WHEN status = 'active' AND starts_at <= NOW() AND ends_at >= NOW() THEN 0
                WHEN status = 'ended' OR ends_at < NOW() THEN 2
                ELSE 1
            END
        ")->orderByDesc('ends_at');

        $giveaways = $query->paginate(12);

        return response()->json([
            'data' => $giveaways->map(fn ($giveaway) => [
                'id' => $giveaway->id,
                'title' => $giveaway->title,
                'slug' => $giveaway->slug,
                'description' => $giveaway->description ? strip_tags($giveaway->description) : null,
                'featured_image' => $giveaway->featured_image
                    ? asset('storage/'.$giveaway->featured_image)
                    : null,

                'prize' => [
                    'name' => $giveaway->prize_name,
                    'value' => $giveaway->prize_value,
                    'image' => $giveaway->prize_image
                        ? asset('storage/'.$giveaway->prize_image)
                        : null,
                ],

                'timing' => [
                    'starts_at' => $giveaway->starts_at?->toISOString(),
                    'ends_at' => $giveaway->ends_at?->toISOString(),
                    'is_active' => $giveaway->isActive(),
                    'has_ended' => $giveaway->hasEnded(),
                    'time_remaining' => $giveaway->getTimeRemaining(),
                ],

                'stats' => [
                    'total_entries' => $giveaway->entries_count,
                    // Null until an editor sets a target; the page draws no
                    // progress bar without one rather than inventing a scale.
                    'entry_goal' => $giveaway->entry_goal,
                ],

                'platform' => $giveaway->platform,
                'prize_type' => $giveaway->prize_type,
                'region' => $giveaway->region,
                'entry_type' => $giveaway->entry_type,

                'winner' => $giveaway->winner ? [
                    'id' => $giveaway->winner->id,
                    'username' => $giveaway->winner->username,
                    'avatar' => $giveaway->winner->avatar_url,
                ] : null,

                'status' => $giveaway->status,
            ]),
            'meta' => [
                'current_page' => $giveaways->currentPage(),
                'last_page' => $giveaways->lastPage(),
                'per_page' => $giveaways->perPage(),
                'total' => $giveaways->total(),
            ],
        ]);
    }

    /**
     * Get giveaway details by slug (public)
     */
    public function show(string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)
            ->where('is_public', true)
            ->with([
                'tasks' => fn ($q) => $q->orderBy('sort_order'),
                'prizeTiers' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $giveaway->id,
                'title' => $giveaway->title,
                'slug' => $giveaway->slug,
                'description' => $giveaway->description,
                'rules' => $giveaway->rules,
                'featured_image' => $giveaway->featured_image
                    ? asset('storage/'.$giveaway->featured_image)
                    : null,

                'prize' => [
                    'name' => $giveaway->prize_name,
                    'value' => $giveaway->prize_value,
                    'image' => $giveaway->prize_image
                        ? asset('storage/'.$giveaway->prize_image)
                        : null,
                ],

                'timing' => [
                    'starts_at' => $giveaway->starts_at?->toISOString(),
                    'ends_at' => $giveaway->ends_at?->toISOString(),
                    'is_active' => $giveaway->isActive(),
                    'has_ended' => $giveaway->hasEnded(),
                    'time_remaining' => $giveaway->getTimeRemaining(),
                ],

                'stats' => [
                    'total_entries' => $giveaway->getEntryCount(),
                    'total_points_pool' => $giveaway->getTotalEntryPool(),
                ],

                'tasks' => $giveaway->tasks->map(fn ($task) => [
                    'id' => $task->id,
                    'type' => $task->type,
                    'title' => $task->title,
                    'description' => $task->description,
                    'points' => $task->points,
                    'url' => $task->url,
                    'icon' => $task->getIcon(),
                    'is_required' => $task->is_required,
                    'is_repeatable' => $task->is_repeatable,
                ]),

                'prize_tiers' => $giveaway->prizeTiers->map(fn ($tier) => [
                    'id' => $tier->id,
                    'tier_name' => $tier->tier_name,
                    'prize_description' => $tier->prize_description,
                    'winner_count' => $tier->winner_count,
                    'min_points' => $tier->min_points,
                ]),

                'winner' => $giveaway->winner ? [
                    'id' => $giveaway->winner->id,
                    'username' => $giveaway->winner->username,
                    'avatar' => $giveaway->winner->avatar_url,
                ] : null,

                'status' => $giveaway->status,
            ],
        ]);
    }

    /**
     * Enter the giveaway (authenticated)
     */
    public function enter(Request $request, string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        if (! $giveaway->isActive()) {
            return response()->json([
                'message' => 'This giveaway is not currently active.',
            ], 422);
        }

        // IP rate limit
        $maxPerIp = config('giveaway.security.max_entries_per_ip', 5);
        $ipCount = GiveawayEntry::where('giveaway_id', $giveaway->id)
            ->where('ip_address', $request->ip())
            ->count();

        if ($ipCount >= $maxPerIp) {
            return response()->json([
                'message' => 'Maximum entries from this network have been reached.',
            ], 429);
        }

        $user = $request->user();

        // Check for existing entry
        $entry = GiveawayEntry::firstOrCreate(
            [
                'giveaway_id' => $giveaway->id,
                'user_id' => $user->id,
            ],
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        // Handle referral if provided
        $referralCode = $request->input('referral_code');
        if ($referralCode && ! $entry->referred_by) {
            $referrer = GiveawayEntry::where('giveaway_id', $giveaway->id)
                ->where('referral_code', $referralCode)
                ->where('user_id', '!=', $user->id)
                ->first();

            if ($referrer) {
                $entry->update(['referred_by' => $referrer->id]);

                // Award referral bonus to referrer
                $referralTask = $giveaway->tasks()->where('type', 'referral')->first();
                if ($referralTask) {
                    $referrer->increment('referral_count');
                    $referrer->addPoints($referralTask->points);
                }
            }
        }

        return response()->json([
            'data' => $this->formatEntry($entry),
            'message' => 'Successfully entered the giveaway!',
        ]);
    }

    /**
     * Get user's entry status (authenticated)
     */
    public function myEntry(Request $request, string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)->where('is_public', true)->firstOrFail();
        $user = $request->user();

        $entry = GiveawayEntry::where('giveaway_id', $giveaway->id)
            ->where('user_id', $user->id)
            ->with('completions')
            ->first();

        if (! $entry) {
            return response()->json([
                'data' => null,
                'message' => 'You have not entered this giveaway yet.',
            ]);
        }

        return response()->json([
            'data' => $this->formatEntry($entry),
        ]);
    }

    /**
     * Complete a task (authenticated)
     */
    public function completeTask(Request $request, string $slug, int $taskId): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)->where('is_public', true)->firstOrFail();
        $user = $request->user();

        if (! $giveaway->isActive()) {
            return response()->json([
                'message' => 'This giveaway is not currently active.',
            ], 422);
        }

        // Get or create entry
        $entry = GiveawayEntry::firstOrCreate(
            [
                'giveaway_id' => $giveaway->id,
                'user_id' => $user->id,
            ],
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        // Find task
        $task = GiveawayTask::where('giveaway_id', $giveaway->id)
            ->where('id', $taskId)
            ->firstOrFail();

        // Check if already completed
        if (! $task->canBeCompletedBy($entry)) {
            return response()->json([
                'message' => 'You have already completed this task.',
            ], 422);
        }

        // "Post in the forum" is actually verified (unlike most task types here,
        // which are self-reported by the click alone) — require a real post
        // made by this user since the giveaway started.
        if ($task->type === 'forum_post') {
            $hasPosted = Post::where('author_id', $user->id)
                ->where('created_at', '>=', $giveaway->starts_at)
                ->exists();

            if (! $hasPosted) {
                return response()->json([
                    'message' => 'Post in the forum first, then come back to complete this task.',
                ], 422);
            }
        }

        // Mark as completed (with race condition protection)
        DB::transaction(function () use ($entry, $task) {
            // Use firstOrCreate to prevent duplicate completions on rapid clicks
            $completion = GiveawayTaskCompletion::firstOrCreate(
                [
                    'entry_id' => $entry->id,
                    'task_id' => $task->id,
                    'completed_date' => $task->is_repeatable ? today() : null,
                ],
                [
                    'completed_at' => now(),
                ]
            );

            // Only add points if this was newly created (not already completed)
            if ($completion->wasRecentlyCreated) {
                $entry->addPoints($task->points);
            }
        });

        // Refresh entry
        $entry->refresh();

        return response()->json([
            'data' => $this->formatEntry($entry),
            'message' => "Task completed! +{$task->points} points",
        ]);
    }

    /**
     * Get leaderboard for a giveaway (cached for performance)
     *
     * PERFORMANCE: Cached for 60 seconds to reduce database load
     * Frontend fetches every 30s, so 50% of requests hit cache
     */
    public function leaderboard(string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)->where('is_public', true)->firstOrFail();

        $cacheKey = "giveaway:{$giveaway->id}:leaderboard";
        $cacheTtl = config('giveaway.cache.leaderboard_ttl', 60);

        $leaders = Cache::remember($cacheKey, $cacheTtl, function () use ($giveaway) {
            return $giveaway->entries()
                ->with('user:id,username,avatar_url')
                ->orderByDesc('total_points')
                ->limit(10)
                ->get()
                ->map(fn ($entry, $index) => [
                    'rank' => $index + 1,
                    'username' => $entry->user->username,
                    'avatar' => $entry->user->avatar_url,
                    'points' => $entry->total_points,
                ]);
        });

        return response()->json([
            'data' => $leaders,
        ]);
    }

    /**
     * Claim daily visit bonus (authenticated)
     */
    public function claimDailyBonus(Request $request, string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)->where('is_public', true)->firstOrFail();
        $user = $request->user();

        if (! $giveaway->isActive()) {
            return response()->json([
                'message' => 'This giveaway is not currently active.',
            ], 422);
        }

        // Get or create entry
        $entry = GiveawayEntry::firstOrCreate(
            [
                'giveaway_id' => $giveaway->id,
                'user_id' => $user->id,
            ],
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        // Update streak
        $result = $entry->updateStreak();

        return response()->json([
            'data' => $this->formatEntry($entry->fresh()),
            'streak' => $result,
        ]);
    }

    /**
     * Format entry for response
     */
    private function formatEntry(GiveawayEntry $entry): array
    {
        $entry->loadMissing(['completions', 'giveaway']);

        return [
            'id' => $entry->id,
            'total_points' => $entry->total_points,
            'referral_code' => $entry->referral_code,
            'referral_url' => $entry->getReferralUrl(),
            'referral_count' => $entry->referral_count,
            'win_chance' => $entry->getWinChance(),
            'completed_task_ids' => $entry->getCompletedTaskIds(),
            'streak_days' => $entry->streak_days,
            'last_visit_date' => $entry->last_visit_date?->toDateString(),
            'can_claim_daily_bonus' => $entry->canClaimDailyBonus(),
            'created_at' => $entry->created_at->toISOString(),
        ];
    }
}
