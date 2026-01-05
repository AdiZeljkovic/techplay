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
            ->with(['user.rank', 'replies.user.rank'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Check for likes if user is logged in
        if (Auth::check()) {
            $userId = Auth::id();
            $comments->getCollection()->transform(function ($comment) use ($userId) {
                // Determine if liked by user
                $comment->is_liked_by_user = \Illuminate\Support\Facades\DB::table('comment_likes')
                    ->where('comment_id', $comment->id)
                    ->where('user_id', $userId)
                    ->exists();

                // Also for replies (recursive check would be better but only 1 level supported for now in UI?)
                // The query `with('replies')` was done.
                if ($comment->replies) {
                    $comment->replies->transform(function ($reply) use ($userId) {
                        $reply->is_liked_by_user = \Illuminate\Support\Facades\DB::table('comment_likes')
                            ->where('comment_id', $reply->id)
                            ->where('user_id', $userId)
                            ->exists();
                        return $reply;
                    });
                }
                return $comment;
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

    public function like($id)
    {
        $comment = Comment::findOrFail($id);
        $userId = Auth::id();

        // Check if already liked
        $existingLike = \Illuminate\Support\Facades\DB::table('comment_likes')
            ->where('comment_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($existingLike) {
            // Unlike
            \Illuminate\Support\Facades\DB::table('comment_likes')
                ->where('comment_id', $id)
                ->where('user_id', $userId)
                ->delete();
            $comment->decrement('likes_count');
            return response()->json(['message' => 'Unliked', 'likes_count' => $comment->likes_count]);
        } else {
            // Like
            \Illuminate\Support\Facades\DB::table('comment_likes')->insert([
                'comment_id' => $id,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $comment->increment('likes_count');
            return response()->json(['message' => 'Liked', 'likes_count' => $comment->likes_count]);
        }
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
}
