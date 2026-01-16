<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index($type, $id)
    {
        $modelClass = $this->getModelClass($type);
        if (!$modelClass) {
            return response()->json(['message' => 'Invalid content type'], 400);
        }

        $comments = Comment::where('commentable_type', $modelClass)
            ->where('commentable_id', $id)
            ->where('status', 'approved')
            ->whereNull('parent_id')
            ->with([
                'user.rank',
                'replies.user.rank',
                'replies.replies.user.rank',
                'replies.replies.replies.user.rank'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Check for likes if user is logged in
        if (Auth::check()) {
            $userId = Auth::id();
            $comments->getCollection()->transform(function ($comment) use ($userId) {
                return $this->processCommentLikeStatus($comment, $userId);
            });
        }

        return \App\Http\Resources\V1\CommentResource::collection($comments);
    }

    public function store(Request $request, \App\Services\XpService $xpService)
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
        if (!$modelClass) {
            return response()->json(['message' => 'Invalid content type'], 400);
        }

        // Verify existance
        if (!$modelClass::where('id', $request->commentable_id)->exists()) {
            return response()->json(['message' => 'Target content not found'], 404);
        }

        // 1. Content Sanitization (Anti-Abuse)
        $cleanContent = strip_tags($request->content);

        // 2. XP Check: Minimum Length
        $shouldAwardXp = strlen($cleanContent) >= 10;

        $comment = Comment::create([
            'user_id' => Auth::id(),
            'commentable_type' => $modelClass,
            'commentable_id' => $request->commentable_id,
            'content' => $cleanContent, // Saved sanitized content
            'parent_id' => $request->parent_id,
            'status' => 'approved',
        ]);

        // 3. Award XP via Service (Handles Cooldowns & Caps)
        if ($shouldAwardXp) {
            $xpService->awardXp(Auth::user(), \App\Services\XpService::XP_COMMENT, 'comment');
        }

        return new \App\Http\Resources\V1\CommentResource($comment->load('user.rank'));
    }

    public function vote(Request $request, $id)
    {
        $request->validate([
            'type' => 'required|in:up,down',
        ]);

        $type = $request->type;
        $comment = Comment::findOrFail($id);
        $userId = Auth::id();

        // Check for existing vote
        $existingVote = \Illuminate\Support\Facades\DB::table('comment_likes')
            ->where('comment_id', $id)
            ->where('user_id', $userId)
            ->first();

        $userVote = null;

        if ($existingVote) {
            if ($existingVote->type === $type) {
                // Toggle off (remove vote)
                \Illuminate\Support\Facades\DB::table('comment_likes')
                    ->where('id', $existingVote->id)
                    ->delete();

                // Update score: removing upvote (-1), removing downvote (+1)
                $change = ($type === 'up') ? -1 : 1;
                $comment->increment('score', $change);
                $userVote = null;
            } else {
                // Change vote type
                \Illuminate\Support\Facades\DB::table('comment_likes')
                    ->where('id', $existingVote->id)
                    ->update(['type' => $type, 'updated_at' => now()]);

                // Update score: up->down (-2), down->up (+2)
                $change = ($type === 'up') ? 2 : -2;
                $comment->increment('score', $change);
                $userVote = $type;
            }
        } else {
            // New vote
            \Illuminate\Support\Facades\DB::table('comment_likes')->insert([
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
            'user_vote' => $userVote
        ]);
    }

    protected function getModelClass($type)
    {
        return match ($type) {
            'article' => Article::class,
            'review' => \App\Models\Review::class,
            'guide' => \App\Models\Guide::class,
            'tech' => Article::class,
            default => null,
        };
    }

    private function processCommentLikeStatus($comment, $userId)
    {
        $comment->is_liked_by_user = \Illuminate\Support\Facades\DB::table('comment_likes')
            ->where('comment_id', $comment->id)
            ->where('user_id', $userId)
            ->exists();

        if ($comment->relationsToArray()['replies'] ?? false) {
            // Check if relation is loaded to avoid trigger lazy load if not needed, 
            // though we eager loaded it. 
            // Standard access $comment->replies is fine since we eager loaded.

            foreach ($comment->replies as $reply) {
                $this->processCommentLikeStatus($reply, $userId);
            }
        }

        return $comment;
    }
}
