<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CommentResource;
use App\Models\Article;
use App\Models\Comment;
use App\Models\Guide;
use App\Models\User;
use App\Notifications\ArticleCommentNotification;
use App\Notifications\CommentReplyNotification;
use App\Services\AchievementService;
use App\Services\QuestService;
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
                // `is_staff` na svakom autoru pita Spatie za role, a to je jedan
                // upit po redu ako se ne ucitaju unaprijed — do 185 redova po
                // stranici izmedju gornjeg nivoa i tri nivoa odgovora.
                'user.roles',
                // The status filter above covers top-level comments only, and
                // Comment has no global scope — so a reply left `pending` by
                // probation or the two-link spam rule was rendered to every
                // visitor anyway. Moderation has to apply at every depth.
                'replies' => fn ($q) => $q->where('status', 'approved')->with('user.rank', 'user.roles')->limit(100), // Prevent memory overload
                'replies.replies' => fn ($q) => $q->where('status', 'approved')->with('user.rank', 'user.roles')->limit(50),
                'replies.replies.replies' => fn ($q) => $q->where('status', 'approved')->with('user.rank', 'user.roles')->limit(25),
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
            'commentable_type' => 'required|string|in:article,review,guide,tech,profile',
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

        /*
         * C. Determine Status (Probation & Spam Heuristics)
         *
         * These messages are shown to the person who wrote the comment, so
         * they are written for them rather than for a log line. A held comment
         * does not appear on the page — the listing serves approved comments
         * only — so this sentence is the only thing standing between "we are
         * checking it" and "the site swallowed what I wrote". One reader
         * posted, was told it worked, refreshed, found nothing, and reported
         * the site as broken. It was not broken; it just never said so.
         */
        $status = 'approved';
        $message = 'Comment posted successfully.';

        // Rule 1: Probation (First 3 comments must be approved)
        // We count only approved comments to require 3 successful interactions.
        $approvedCount = Comment::where('user_id', $user->id)->where('status', 'approved')->count();

        if ($approvedCount < 3) {
            $status = 'pending';
            $message = 'Thanks — an editor will read this before it goes up. '
                .'We check the first three comments from a new member; after that yours appear straight away.';
        }

        // Rule 2: Link Limit (More than 1 link = pending)
        // Simple regex to count http/https occurrences
        $urlCount = preg_match_all('#https?://#i', $cleanContent);
        if ($urlCount > 1) {
            // The message has to be decided before the status changes. It was
            // set after, so the branch could never be true and a user posting
            // two links was told "Comment posted successfully" while the
            // comment sat in the moderation queue.
            if ($status === 'approved') {
                $message = 'Thanks — an editor will read this before it goes up, '
                    .'because comments with more than one link are checked first.';
            }

            $status = 'pending';
        }
        // --- SPAM PROTECTION END ---

        // 2. XP Check: Minimum Length
        $shouldAwardXp = strlen($cleanContent) >= 10;

        // The reader is only ever served three levels of replies, so a reply
        // to a fourth-level comment used to be saved and then vanish. Refuse
        // it instead, and say why.
        if ($request->parent_id) {
            $depth = 0;
            $cursor = Comment::find($request->parent_id);
            while ($cursor && $cursor->parent_id && $depth < 10) {
                $depth++;
                $cursor = Comment::find($cursor->parent_id);
            }

            if ($depth >= 2) {
                return response()->json([
                    'message' => 'This thread is as deep as it goes — reply to the comment above instead.',
                ], 422);
            }
        }

        $comment = Comment::create([
            'user_id' => $user->id,
            'commentable_type' => $modelClass,
            'commentable_id' => $request->commentable_id,
            'content' => $cleanContent, // Saved sanitized content
            'parent_id' => $request->parent_id,
            'status' => $status,
        ]);

        // 3. Award XP via Service (Handles Cooldowns & Caps)
        //
        // Only for a comment that is actually live. A held comment — probation,
        // or two links and up — used to pay the same as a published one, so
        // spam nobody would ever see earned exactly as much as a real reply.
        // CommentObserver pays it if and when a moderator approves.
        if ($shouldAwardXp && $comment->status === 'approved') {
            $xpService->awardXp(Auth::user(), XpService::XP_COMMENT, 'comment');
            $comment->forceFill(['xp_awarded_at' => now()])->saveQuietly();
        }

        // 4. Check comment-count achievements (fire-and-forget)
        try {
            app(AchievementService::class)->check(Auth::user(), ['comments_count']);

            // Same rule as the XP above: a held comment has not happened yet
            // as far as anyone else is concerned, so it does not move a quest
            // either. CommentObserver credits it if a moderator approves.
            if ($comment->status === 'approved') {
                app(QuestService::class)->progress(Auth::user(), 'comment_posted');
            }
        } catch (\Throwable) {
        }

        // 5. Send notifications (only for approved comments, never blocks response)
        if ($comment->status === 'approved') {
            $this->sendCommentNotifications($comment, $user, $request->commentable_type);
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

            // Approved only: voting on any id used to answer 200-vs-404, which
            // enumerated the comments moderation had hidden.
            $comment = Comment::where('status', 'approved')->findOrFail($id);

            // Explicitly get user from Sanctum guard
            $user = Auth::guard('sanctum')->user();
            if (! $user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            $userId = $user->id;

            if ((int) $comment->user_id === (int) $user->id) {
                return response()->json(['message' => 'You cannot vote on your own comment.'], 422);
            }

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
            // Driver errors name tables and columns; they go to the log, not
            // to whoever made the write fail.
            Log::error('Comment vote failed', ['user' => Auth::id(), 'exception' => $e]);

            return response()->json(['message' => 'Could not record that vote. Try again in a moment.'], 500);
        }
    }

    private function sendCommentNotifications(Comment $comment, User $commenter, string $commentableType): void
    {
        try {
            if ($comment->parent_id) {
                // Reply → notify the parent comment's author
                $parent = Comment::with('user')->find($comment->parent_id);
                if (! $parent || ! $parent->user || $parent->user->id === $commenter->id) {
                    return;
                }

                $link = $this->resolveContentLink($commentableType, $comment->commentable_id);
                $parent->user->notify(new CommentReplyNotification($comment, $commenter, $link));
            } elseif ($commentableType === 'profile') {
                // Profile wall → notify the profile owner directly
                $owner = User::find($comment->commentable_id);
                if (! $owner || $owner->id === $commenter->id) {
                    return;
                }
                $owner->notify(new ArticleCommentNotification($comment, $commenter, 'your profile', "/profile/{$owner->username}"));
            } else {
                // Top-level comment → notify content author
                $modelClass = $this->getModelClass($commentableType);
                if (! $modelClass) {
                    return;
                }

                $content = $modelClass::with('author')->find($comment->commentable_id);
                if (! $content || ! $content->author || $content->author->id === $commenter->id) {
                    return;
                }

                $link = $this->resolveContentLink($commentableType, $comment->commentable_id, $content->slug ?? null);
                $title = $content->title ?? ($content->name ?? '');
                $content->author->notify(new ArticleCommentNotification($comment, $commenter, $title, $link));
            }
        } catch (\Throwable $e) {
            Log::warning('Comment notification failed: '.$e->getMessage());
        }
    }

    private function resolveContentLink(string $commentableType, int $contentId, ?string $slug = null): string
    {
        if ($commentableType === 'profile') {
            $username = User::find($contentId)?->username ?? '';

            return "/profile/{$username}";
        }

        if (! $slug) {
            $modelClass = $this->getModelClass($commentableType);
            $slug = $modelClass ? ($modelClass::find($contentId)?->slug ?? '') : '';
        }

        $prefix = match ($commentableType) {
            'review' => 'reviews',
            'guide' => 'guides',
            'tech' => 'hardware',
            default => 'news',
        };

        return "/{$prefix}/{$slug}";
    }

    protected function getModelClass($type)
    {
        return match ($type) {
            'article' => Article::class,
            // A review is an Article with a review category, exactly as `tech`
            // below is. This used to map to a `Review` model whose table has
            // never held a row — so a comment left on a review page was stored
            // against a record that does not exist. It read back correctly, by
            // itself, which is why nobody noticed; but `$comment->commentable`
            // was null for every one of them, so the link in the notification
            // had no slug and admin moderation could not show what was being
            // discussed. No data to migrate: all 19 comments in production are
            // already Article.
            'review' => Article::class,
            'guide' => Guide::class,
            'tech' => Article::class,
            'profile' => User::class, // profile wall (V3)
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
