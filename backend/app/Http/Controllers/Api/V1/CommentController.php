<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CommentResource;
use App\Models\Article;
use App\Models\Comment;
use App\Models\Guide;
use App\Models\Review;
use App\Services\AchievementService;
use App\Services\SanitizationService;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function index($type, $id)
    {
        $modelClass = $this->getModelClass($type);
        if (! $modelClass) {
            return response()->json(['message' => 'Invalid content type'], 400);
        }

        $comments = Comment::where('commentable_type', $modelClass)
            ->where('commentable_id', $id)
            ->where('status', 'approved')
            ->whereNull('parent_id')
            ->with([
                'user.rank',
                'replies' => fn ($q) => $q->with('user.rank')->limit(100), // Prevent memory overload
                'replies.replies' => fn ($q) => $q->with('user.rank')->limit(50),
                'replies.replies.replies' => fn ($q) => $q->with('user.rank')->limit(25),
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // PERFORMANCE FIX: Bulk load all likes in ONE query instead of N+1
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $userId = $user->id;

            // Collect ALL comment IDs (parent + nested replies)
            $allCommentIds = $this->collectAllCommentIds($comments->items());

            // Single query to get all user's votes for these comments
            $userVotes = DB::table('comment_likes')
                ->whereIn('comment_id', $allCommentIds)
                ->where('user_id', $userId)
                ->pluck('type', 'comment_id')
                ->toArray();

            // Apply votes to all comments
            $comments->getCollection()->transform(function ($comment) use ($userVotes) {
                return $this->applyUserVotes($comment, $userVotes);
            });
        }

        return CommentResource::collection($comments);
    }

    public function store(Request $request, XpService $xpService, SanitizationService $sanitizer)
    {
        $request->validate([
            'content' => [
                'required',
                'string',
                'max:1000',
                // Custom rule could go here, but doing manual check for now
            ],
            'commentable_id' => 'required|integer',
            'commentable_type' => 'required|string|in:article,review,guide,tech',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $modelClass = $this->getModelClass($request->commentable_type);
        if (! $modelClass) {
            return response()->json(['message' => 'Invalid content type'], 400);
        }

        // Verify existance
        if (! $modelClass::where('id', $request->commentable_id)->exists()) {
            return response()->json(['message' => 'Target content not found'], 404);
        }

        // 1. Content Sanitization (XSS Protection)
        $cleanContent = $sanitizer->sanitizePlainText($request->input('content'));

        // 1a. Spam Detection
        if ($sanitizer->detectSpam($cleanContent)) {
            return response()->json(['message' => 'Comment flagged as spam.'], 422);
        }

        // --- SPAM PROTECTION START ---
        $user = Auth::user();

        // A. Cooldown Check (15 seconds)
        $lastComment = Comment::where('user_id', $user->id)->latest()->first();
        if ($lastComment && $lastComment->created_at->diffInSeconds(now()) < 15) {
            return response()->json(['message' => 'Please wait a few seconds before posting again.'], 429);
        }

        // B. Duplicate Check (5 minutes)
        $isDuplicate = Comment::where('user_id', $user->id)
            ->where('content', $cleanContent)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($isDuplicate) {
            return response()->json(['message' => 'You have already posted this comment recently.'], 422);
        }

        // C. Determine Status (Probation & Spam Heuristics)
        $status = 'approved';
        $message = 'Comment posted successfully.';

        // Rule 1: Probation (First 3 comments must be approved)
        // We count only approved comments to require 3 successful interactions.
        $approvedCount = Comment::where('user_id', $user->id)->where('status', 'approved')->count();

        if ($approvedCount < 3) {
            $status = 'pending';
            $message = 'Comment submitted for approval (New user probation).';
        }

        // Rule 2: Link Limit (More than 1 link = pending)
        // Simple regex to count http/https occurrences
        $urlCount = preg_match_all('#https?://#i', $cleanContent);
        if ($urlCount > 1) {
            $status = 'pending';
            // If it was already pending from probation, the message remains appropriate,
            // but if it was approved, we downgrade to pending.
            if ($status === 'approved') {
                $message = 'Comment submitted for approval (Link limit).';
            }
            $status = 'pending';
        }
        // --- SPAM PROTECTION END ---

        // 2. XP Check: Minimum Length
        $shouldAwardXp = strlen($cleanContent) >= 10;

        $comment = Comment::create([
            'user_id' => $user->id,
            'commentable_type' => $modelClass,
            'commentable_id' => $request->commentable_id,
            'content' => $cleanContent, // Saved sanitized content
            'parent_id' => $request->parent_id,
            'status' => $status,
        ]);

        // 3. Award XP via Service (Handles Cooldowns & Caps)
        if ($shouldAwardXp) {
            $xpService->awardXp(Auth::user(), XpService::XP_COMMENT, 'comment');
        }

        // 4. Check comment-count achievements (fire-and-forget)
        try {
            app(AchievementService::class)->check(Auth::user(), ['comments_count']);
        } catch (\Throwable) {
        }

        return (new CommentResource($comment->load('user.rank')))
            ->additional([
                'message' => $message,
                'status' => $status,
            ]);
    }

    public function vote(Request $request, $id)
    {
        $request->validate([
            'type' => 'required|in:up,down',
        ]);

        try {
            $type = $request->type;
            $comment = Comment::findOrFail($id);

            // Explicitly get user from Sanctum guard
            $user = Auth::guard('sanctum')->user();
            if (! $user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            $userId = $user->id;

            // Check for existing vote
            $existingVote = DB::table('comment_likes')
                ->where('comment_id', $id)
                ->where('user_id', $userId)
                ->first();

            $userVote = null;

            if ($existingVote) {
                if ($existingVote->type === $type) {
                    // Toggle off (remove vote)
                    DB::table('comment_likes')
                        ->where('id', $existingVote->id)
                        ->delete();

                    // Update score: removing upvote (-1), removing downvote (+1)
                    $change = ($type === 'up') ? -1 : 1;
                    $comment->increment('score', $change);
                    $userVote = null;
                } else {
                    // Change vote type
                    DB::table('comment_likes')
                        ->where('id', $existingVote->id)
                        ->update(['type' => $type, 'updated_at' => now()]);

                    // Update score: up->down (-2), down->up (+2)
                    $change = ($type === 'up') ? 2 : -2;
                    $comment->increment('score', $change);
                    $userVote = $type;
                }
            } else {
                // New vote
                DB::table('comment_likes')->insert([
                    'comment_id' => $id,
                    'user_id' => $userId,
                    'type' => $type,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $change = ($type === 'up') ? 1 : -1;
                $comment->increment('score', $change);
                $userVote = $type;
            }

            return response()->json([
                'message' => 'Vote recorded',
                'score' => (int) $comment->score,
                'user_vote' => $userVote,
            ]);
        } catch (\Exception $e) {
            Log::error('Vote error: '.$e->getMessage());

            return response()->json(['message' => 'Server Error: '.$e->getMessage()], 500);
        }
    }

    protected function getModelClass($type)
    {
        return match ($type) {
            'article' => Article::class,
            'review' => Review::class,
            'guide' => Guide::class,
            'tech' => Article::class,
            default => null,
        };
    }

    /**
     * PERFORMANCE: Collect all comment IDs recursively in ONE pass (O(n) instead of O(n²))
     * Replaces multiple DB queries with single array collection
     */
    private function collectAllCommentIds($comments): array
    {
        $ids = [];

        foreach ($comments as $comment) {
            $ids[] = $comment->id;

            // Recursively collect reply IDs
            if ($comment->relationLoaded('replies') && $comment->replies->isNotEmpty()) {
                $ids = array_merge($ids, $this->collectAllCommentIds($comment->replies));
            }
        }

        return $ids;
    }

    /**
     * PERFORMANCE: Apply user votes from pre-loaded array (O(1) lookup per comment)
     * Old: N queries (one per comment)
     * New: 1 query + O(n) array lookup
     */
    private function applyUserVotes($comment, array $userVotes)
    {
        $comment->user_vote = $userVotes[$comment->id] ?? null;
        $comment->is_liked_by_user = ($userVotes[$comment->id] ?? null) === 'up';

        // Recursively apply to nested replies
        if ($comment->relationLoaded('replies') && $comment->replies->isNotEmpty()) {
            $comment->replies->transform(function ($reply) use ($userVotes) {
                return $this->applyUserVotes($reply, $userVotes);
            });
        }

        return $comment;
    }
}
