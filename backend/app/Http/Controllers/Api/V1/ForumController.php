<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;  // Placeholder to keep tool happy without changing verification


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
                    $q->withCount(['posts as real_posts_count', 'threads as real_threads_count'])
                        ->with(['rank', 'roles']);
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

        $posts = $thread->posts()
            ->with([
                'author' => function ($q) {
                    $q->withCount(['posts as real_posts_count', 'threads as real_threads_count'])
                        ->with(['rank', 'roles']);
                }
            ])
            ->paginate(15);

        return response()->json([
            'thread' => new \App\Http\Resources\V1\ThreadResource($thread),
            'posts' => \App\Http\Resources\V1\PostResource::collection($posts)
        ]);
    }

    public function createPost(Request $request, $slug)
    {
        $request->validate([
            'content' => 'required|string|min:5|max:10000' // Max 10k chars for post
        ]);

        // Sanitize content
        $content = strip_tags($request->content, '<p><br><strong><em><ul><ol><li><a><code><pre>');

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
            $post = $thread->posts()->create([
                'content' => $content, // Use sanitized content
                'author_id' => Auth::id(),
                'thread_id' => $thread->id
            ]);

            \Illuminate\Support\Facades\Log::info('createPost: Post created', ['id' => $post->id]);

            $thread->touch();

            // Clear thread cache
            Cache::forget("forum.thread.{$slug}");

            $post->load('author.rank'); // Ensure rank loaded, posts_count might be missing on new post but can default to 1?

            // Reload author to get post count properly if needed, but for performance, we can skip or reload count.
            // Actually, newly created post author has at least 1 post now. 
            // Better to load posts_count too.
            $post->author->loadCount(['posts', 'threads']);

            // Return simplified response to avoid serialization issues
            return new \App\Http\Resources\V1\PostResource($post);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create post: ' . $e->getMessage());
            // Fallback logging
            try {
                file_put_contents(storage_path('logs/custom_error.log'), $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL, FILE_APPEND);
            } catch (\Throwable $t) {
            }

            return response()->json(['message' => 'Failed to create post: ' . $e->getMessage()], 500);
        }
    }

    public function createThread(Request $request)
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

            // Sanitize content (allow some HTML for formatting)
            $cleanContent = strip_tags($request->content, '<p><br><strong><em><ul><ol><li><a><code><pre><blockquote>');

            $slug = \Illuminate\Support\Str::slug($request->title) . '-' . uniqid();

            $thread = Thread::create([
                'title' => strip_tags($request->title), // Strip HTML from title
                'slug' => $slug,
                'content' => $cleanContent, // Use sanitized content
                'category_id' => $request->category_id,
                'author_id' => Auth::id()
            ]);

            \Illuminate\Support\Facades\Log::info('Thread created successfully', ['id' => $thread->id]);

            // Clear all forum caches to show new thread immediately
            Cache::forget('forum.categories');

            // Get category slug to clear specific cache
            $category = Category::find($request->category_id);
            if ($category) {
                // Clear first few pages of category cache
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

        // Check if already upvoted
        $exists = \Illuminate\Support\Facades\DB::table('thread_upvotes')
            ->where('user_id', Auth::id())
            ->where('thread_id', $thread->id)
            ->exists();

        if ($exists) {
            // Remove upvote
            \Illuminate\Support\Facades\DB::table('thread_upvotes')
                ->where('user_id', Auth::id())
                ->where('thread_id', $thread->id)
                ->delete();
            $action = 'removed';
        } else {
            // Add upvote
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
}
