<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use App\Notifications\ForumReplyNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;


class ForumController extends Controller
{
    public function stats()
    {
        // Cache stats for 5 minutes
        $stats = Cache::remember('forum.stats', 300, function () {
            return [
                'total_threads' => Thread::count(),
                'total_posts' => Thread::count() + Post::count(),
                'members' => \App\Models\User::count(),
            ];
        });

        return response()->json($stats)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function categories()
    {
        // PERFORMANCE: Cache for 60 seconds
        $categories = Cache::remember('forum.categories', 60, function () {
            // Get all forum categories with thread counts
            $allForumCategories = Category::where('type', 'forum')
                ->withCount('threads')
                ->orderBy('id')
                ->get();

            // Get category IDs for batch loading latest threads
            $categoryIds = $allForumCategories->pluck('id');

            // PERFORMANCE: Single query to get latest thread per category (no N+1)
            $latestThreads = \App\Models\Thread::whereIn('category_id', $categoryIds)
                ->with('author:id,username,avatar_url')
                ->select('id', 'title', 'slug', 'category_id', 'author_id', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get()
                ->groupBy('category_id')
                ->map(fn($threads) => $threads->first());

            // Attach latest_thread to each category
            $allForumCategories->each(function ($cat) use ($latestThreads) {
                $cat->latest_thread = $latestThreads->get($cat->id);
            });

            // Separate into parents and children
            $parents = $allForumCategories->whereNull('parent_id');
            $children = $allForumCategories->whereNotNull('parent_id');

            // Flat structure case
            if ($parents->isEmpty() && $allForumCategories->isNotEmpty()) {
                return $allForumCategories->values();
            }

            // Hierarchical structure - attach children to parents
            $parents->each(function ($parent) use ($children) {
                $parent->children = $children->where('parent_id', $parent->id)->values();
            });

            return $parents->values();
        });

        return response()->json($categories)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function showCategory($slug)
    {
        $page = request()->get('page', 1);
        $cacheKey = "forum.category.{$slug}.page_{$page}";

        // Reduced cache time to 30 seconds for faster updates
        $data = Cache::remember($cacheKey, 30, function () use ($slug) {
            \Illuminate\Support\Facades\Log::info("Fetching category with slug: " . $slug);
            $category = Category::where('slug', $slug)->where('type', 'forum')->first();

            if (!$category) {
                \Illuminate\Support\Facades\Log::error("Category not found for slug: " . $slug);
                abort(404, 'Category not found');
            }

            $threads = $category->threads()
                ->with(['author', 'latestPost.author'])
                ->withCount('posts')
                ->orderBy('is_pinned', 'desc')
                ->latest('updated_at')
                ->paginate(20);

            return [
                'category' => $category,
                'threads' => $threads
            ];
        });

        return response()->json($data)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function showThread($slug)
    {
        $thread = Thread::where('slug', $slug)
            ->with([
                'author' => function ($q) {
                    $q->with(['rank', 'roles']);
                },
                'category'
            ])
            ->withCount(['posts', 'upvotes']) // Add upvotes count
            ->firstOrFail();

        // PERFORMANCE: Use Redis atomic increment instead of sync DB write
        // Views are flushed to DB every 5 minutes by FlushViewCounters job
        \Illuminate\Support\Facades\Redis::incr("views:thread:{$thread->id}");

        $thread->is_upvoted = Auth::guard('sanctum')->check()
            ? \Illuminate\Support\Facades\DB::table('thread_upvotes')
                ->where('user_id', Auth::guard('sanctum')->id())
                ->where('thread_id', $thread->id)
                ->exists()
            : false;

        if ($thread->author) {
            $thread->author->loadCount(['posts', 'threads']);
        }

        $posts = $thread->posts()
            ->with([
                'author' => function ($q) {
                    $q->with(['rank', 'roles']);
                }
            ])
            ->paginate(15);

        // Manually load counts to ensure accuracy
        $posts->getCollection()->each(function ($post) {
            if ($post->author) {
                $post->author->loadCount(['posts', 'threads']);
            }
        });

        return response()->json([
            'thread' => new \App\Http\Resources\V1\ThreadResource($thread),
            'posts' => \App\Http\Resources\V1\PostResource::collection($posts)
        ]);
    }

    public function createPost(Request $request, $slug, \App\Services\SanitizationService $sanitizer)
    {
        $request->validate([
            'content' => 'required|string|min:5|max:10000' // Max 10k chars for post
        ]);

        // Sanitize content (XSS Protection)
        $content = $sanitizer->sanitizeRichContent($request->content);

        // Spam detection
        if ($sanitizer->detectSpam($content)) {
            return response()->json(['message' => 'Post flagged as spam.'], 422);
        }

        $thread = Thread::where('slug', $slug)->firstOrFail();

        // Restrict replies in "News & Announcements"
        $category = $thread->category;
        if ($category && ($category->slug === 'news-announcements' || $category->name === 'News & Announcements')) {
            $user = Auth::user();
            $allowedRoles = ['Super Admin', 'Admin', 'Editor', 'Editor-in-Chief', 'Journalist', 'Moderator'];

            $hasPermission = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'editor', 'moderator']);

            if (!$hasPermission) {
                return response()->json(['message' => 'Only staff members can reply in News & Announcements.'], 403);
            }
        }

        if ($thread->is_locked) {
            return response()->json(['message' => 'Thread is locked.'], 403);
        }

        \Illuminate\Support\Facades\Log::info('createPost: Attempting to create', ['user' => Auth::id(), 'thread' => $thread->id]);

        try {
            // RACE CONDITION FIX: Use DB transaction with cache invalidation AFTER commit
            $post = \Illuminate\Support\Facades\DB::transaction(function () use ($thread, $content, $slug) {
                $post = $thread->posts()->create([
                    'content' => $content,
                    'author_id' => Auth::id(),
                    'thread_id' => $thread->id
                ]);

                // Update thread timestamp inside transaction
                $thread->touch();

                return $post;
            });

            // Cache invalidation AFTER successful transaction commit
            Cache::forget("forum.thread.{$slug}");

            \Illuminate\Support\Facades\Log::info('createPost: Post created', ['id' => $post->id]);

            // Notify thread author if they are not the replier
            $thread->load('author');
            if ($thread->author && $thread->author_id !== Auth::id()) {
                $thread->author->notify(new ForumReplyNotification($post, $thread, Auth::user()));
            }

            $post->load('author.rank');
            $post->author->loadCount(['posts', 'threads']);

            return new \App\Http\Resources\V1\PostResource($post);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create post: ' . $e->getMessage());
            try {
                file_put_contents(storage_path('logs/custom_error.log'), $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL, FILE_APPEND);
            } catch (\Throwable $t) {
            }

            return response()->json(['message' => 'Failed to create post: ' . $e->getMessage()], 500);
        }
    }

    public function createThread(Request $request, \App\Services\SanitizationService $sanitizer)
    {
        \Illuminate\Support\Facades\Log::info('createThread called', [
            'data' => $request->all(),
            'user_id' => Auth::id()
        ]);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255|min:5',
                'content' => 'required|string|min:10|max:20000', // Max 20k chars for thread
                'category_id' => 'required|exists:categories,id'
            ]);

            // check restriction for "News & Announcements"
            $category = Category::find($request->category_id);
            if ($category && ($category->slug === 'news-announcements' || $category->name === 'News & Announcements')) {
                $user = Auth::user();
                $allowedRoles = ['Super Admin', 'Admin', 'Editor', 'Editor-in-Chief', 'Journalist', 'Moderator'];

                // Check Spatie roles or legacy role column
                $hasPermission = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'editor', 'moderator']);

                if (!$hasPermission) {
                    return response()->json(['message' => 'Only staff members can create threads in News & Announcements.'], 403);
                }
            }

            // Sanitize content (XSS Protection)
            $cleanContent = $sanitizer->sanitizeRichContent($request->content);
            $cleanTitle = $sanitizer->sanitizeTitle($request->title);

            // Spam detection
            if ($sanitizer->detectSpam($cleanContent) || $sanitizer->detectSpam($cleanTitle)) {
                return response()->json(['message' => 'Thread flagged as spam.'], 422);
            }

            $slug = \Illuminate\Support\Str::slug($request->title) . '-' . uniqid();

            // RACE CONDITION FIX: Use DB transaction with cache invalidation AFTER commit
            $thread = \Illuminate\Support\Facades\DB::transaction(function () use ($cleanTitle, $slug, $cleanContent, $request) {
                return Thread::create([
                    'title' => $cleanTitle,
                    'slug' => $slug,
                    'content' => $cleanContent,
                    'category_id' => $request->category_id,
                    'author_id' => Auth::id()
                ]);
            });

            \Illuminate\Support\Facades\Log::info('Thread created successfully', ['id' => $thread->id]);

            // Cache invalidation AFTER successful transaction commit
            Cache::forget('forum.categories');

            // Clear category-specific cache
            $category = Category::find($request->category_id);
            if ($category) {
                for ($i = 1; $i <= 5; $i++) {
                    Cache::forget("forum.category.{$category->slug}.page_{$i}");
                }
            }

            return response()->json($thread, 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create thread: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Failed to create thread. ' . $e->getMessage()], 500);
        }
    }
    public function activeThreads()
    {
        // Cache for 60 seconds
        $threads = Cache::remember('forum.active_threads', 60, function () {
            return Thread::with(['author'])
                ->withCount('posts')
                ->orderByDesc('updated_at')
                ->take(5)
                ->get();
        });

        return response()->json($threads)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    public function upvote($slug)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();

        $exists = \Illuminate\Support\Facades\DB::table('thread_upvotes')
            ->where('user_id', Auth::id())
            ->where('thread_id', $thread->id)
            ->exists();

        if ($exists) {
            \Illuminate\Support\Facades\DB::table('thread_upvotes')
                ->where('user_id', Auth::id())
                ->where('thread_id', $thread->id)
                ->delete();
            $action = 'removed';
        } else {
            \Illuminate\Support\Facades\DB::table('thread_upvotes')->insert([
                'user_id' => Auth::id(),
                'thread_id' => $thread->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $action = 'added';
        }

        return response()->json([
            'message' => 'Upvote updated',
            'action' => $action,
            'count' => \Illuminate\Support\Facades\DB::table('thread_upvotes')->where('thread_id', $thread->id)->count()
        ]);
    }

    public function pinThread(Request $request, string $slug)
    {
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Editor-in-Chief', 'Moderator'];

        if (!$user->hasAnyRole($allowedRoles) && !in_array($user->role, ['admin', 'super_admin', 'moderator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $thread->is_pinned = !$thread->is_pinned;
        $thread->save();

        // Invalidate category cache so pinned order refreshes
        for ($i = 1; $i <= 5; $i++) {
            Cache::forget("forum.category.{$thread->category->slug}.page_{$i}");
        }

        return response()->json([
            'is_pinned' => $thread->is_pinned,
            'message' => $thread->is_pinned ? 'Thread pinned.' : 'Thread unpinned.',
        ]);
    }

    public function updatePost(Request $request, string $slug, int $postId, \App\Services\SanitizationService $sanitizer)
    {
        $request->validate(['content' => 'required|string|min:5|max:10000']);

        $post = Post::findOrFail($postId);
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Moderator'];

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if (!$isOwner && !$isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->content = $sanitizer->sanitizeRichContent($request->content);
        $post->edited_at = now();
        $post->save();

        Cache::forget("forum.thread.{$slug}");

        $post->load('author.rank');
        $post->author->loadCount(['posts', 'threads']);

        return new \App\Http\Resources\V1\PostResource($post);
    }

    public function deletePost(Request $request, string $slug, int $postId)
    {
        $post = Post::findOrFail($postId);
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Moderator'];

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if (!$isOwner && !$isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->delete(); // Soft delete

        Cache::forget("forum.thread.{$slug}");

        return response()->json(['message' => 'Post deleted.']);
    }

    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:3|max:100']);
        $query = $request->get('q');

        $threads = Thread::whereRaw(
                "to_tsvector('english', title || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', ?)",
                [$query]
            )
            ->with(['author:id,username,avatar_url', 'category:id,name,slug'])
            ->withCount('posts')
            ->orderByRaw(
                "ts_rank(to_tsvector('english', title || ' ' || coalesce(content, '')), plainto_tsquery('english', ?)) DESC",
                [$query]
            )
            ->limit(20)
            ->get();

        $posts = Post::whereRaw(
                "to_tsvector('english', coalesce(content, '')) @@ plainto_tsquery('english', ?)",
                [$query]
            )
            ->whereNull('deleted_at')
            ->with(['author:id,username,avatar_url', 'thread:id,title,slug'])
            ->orderByRaw(
                "ts_rank(to_tsvector('english', coalesce(content, '')), plainto_tsquery('english', ?)) DESC",
                [$query]
            )
            ->limit(10)
            ->get();

        return response()->json([
            'threads' => $threads,
            'posts' => $posts,
            'query' => $query,
        ]);
    }
}
