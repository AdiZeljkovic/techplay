<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Giveaway;
use App\Models\GiveawayEntry;
use App\Models\GiveawayTask;
use App\Models\GiveawayTaskCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GiveawayController extends Controller
{
    /**
     * Get giveaway details by slug (public)
     */
    public function show(string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)
            ->where('is_public', true)
            ->with(['tasks' => fn($q) => $q->orderBy('sort_order')])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $giveaway->id,
                'title' => $giveaway->title,
                'slug' => $giveaway->slug,
                'description' => $giveaway->description,
                'rules' => $giveaway->rules,
                'featured_image' => $giveaway->featured_image
                    ? asset('storage/' . $giveaway->featured_image)
                    : null,

                'prize' => [
                    'name' => $giveaway->prize_name,
                    'value' => $giveaway->prize_value,
                    'image' => $giveaway->prize_image
                        ? asset('storage/' . $giveaway->prize_image)
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

                'tasks' => $giveaway->tasks->map(fn($task) => [
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

        if (!$giveaway->isActive()) {
            return response()->json([
                'message' => 'This giveaway is not currently active.',
            ], 422);
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
        if ($referralCode && !$entry->referred_by) {
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
        $giveaway = Giveaway::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $entry = GiveawayEntry::where('giveaway_id', $giveaway->id)
            ->where('user_id', $user->id)
            ->with('completions')
            ->first();

        if (!$entry) {
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
        $giveaway = Giveaway::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        if (!$giveaway->isActive()) {
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
        if (!$task->canBeCompletedBy($entry)) {
            return response()->json([
                'message' => 'You have already completed this task.',
            ], 422);
        }

        // Mark as completed
        DB::transaction(function () use ($entry, $task) {
            GiveawayTaskCompletion::create([
                'entry_id' => $entry->id,
                'task_id' => $task->id,
                'completed_at' => now(),
                'completed_date' => $task->is_repeatable ? today() : null,
            ]);

            $entry->addPoints($task->points);
        });

        // Refresh entry
        $entry->refresh();

        return response()->json([
            'data' => $this->formatEntry($entry),
            'message' => "Task completed! +{$task->points} points",
        ]);
    }

    /**
     * Get leaderboard for a giveaway
     */
    public function leaderboard(string $slug): JsonResponse
    {
        $giveaway = Giveaway::where('slug', $slug)->firstOrFail();

        $leaders = $giveaway->entries()
            ->with('user:id,username,avatar')
            ->orderByDesc('total_points')
            ->limit(10)
            ->get()
            ->map(fn($entry, $index) => [
                'rank' => $index + 1,
                'username' => $entry->user->username,
                'avatar' => $entry->user->avatar_url,
                'points' => $entry->total_points,
            ]);

        return response()->json([
            'data' => $leaders,
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
            'created_at' => $entry->created_at->toISOString(),
        ];
    }
}
