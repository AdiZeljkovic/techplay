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
        return Cache::remember('forum.stats', 300, function () {
            return [
                'total_threads' => Thread::count(),
                'total_posts' => Post::count(),
                'members' => \App\Models\User::count(),
            ];
        });
    }

    public function categories()
    {
        // No cache during debugging - will add back after fixes
        // Get ALL forum categories
        $allForumCategories = Category::where('type', 'forum')
            ->withCount('threads')
            ->orderBy('id')
            ->get();

        // Separate into parents and children
        $parents = $allForumCategories->whereNull('parent_id');
        $children = $allForumCategories->whereNotNull('parent_id');

        // If there are no parent categories but there ARE forum categories,
        // return them directly (flat structure)
        if ($parents->isEmpty() && $allForumCategories->isNotEmpty()) {
            // Flat structure - return all as-is
            $allForumCategories->each(function ($cat) {
                $cat->latest_thread = $cat->threads()->with('author')->latest()->first();
            });
            return $allForumCategories->values();
        }

        // Hierarchical structure - attach children to parents
        $parents->each(function ($parent) use ($children) {
            $parent->children = $children->where('parent_id', $parent->id)->values();

            // Add latest thread to each child
            if ($parent->children) {
                $parent->children->each(function ($child) {
                    $child->latest_thread = $child->threads()->with('author')->latest()->first();
                });
            }

            // Also add latest thread to parent if it has threads directly
            $parent->latest_thread = $parent->threads()->with('author')->latest()->first();
        });

        return $parents->values();
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

        return response()->json($data);
    }

    public function showThread($slug)
    {
        $thread = Thread::where('slug', $slug)
            ->with(['author.rank', 'category'])
            ->withCount(['posts', 'upvotes']) // Add upvotes count
            ->firstOrFail();

        $thread->increment('view_count');

        $thread->is_upvoted = Auth::guard('sanctum')->check()
            ? \Illuminate\Support\Facades\DB::table('thread_upvotes')
                ->where('user_id', Auth::guard('sanctum')->id())
                ->where('thread_id', $thread->id)
                ->exists()
            : false;

        $posts = $thread->posts()
            ->with('author.rank')
            ->paginate(15);

        return response()->json([
            'thread' => $thread,
            'posts' => $posts
        ]);
    }

    public function createPost(Request $request, $slug)
    {
        $request->validate([
            'content' => 'required|string|min:5'
        ]);

        $thread = Thread::where('slug', $slug)->firstOrFail();

        if ($thread->is_locked) {
            return response()->json(['message' => 'Thread is locked.'], 403);
        }

        try {
            $post = $thread->posts()->create([
                'content' => $request->content,
                'author_id' => Auth::id(),
                'thread_id' => $thread->id
            ]);

            $thread->touch();

            // Clear thread cache
            Cache::forget("forum.thread.{$slug}");

            $post->load('author.rank', 'thread'); // Load relationships for frontend

            return response()->json($post, 201);
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
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'category_id' => 'required|exists:categories,id'
            ]);

            $slug = \Illuminate\Support\Str::slug($request->title) . '-' . uniqid();

            $thread = Thread::create([
                'title' => $request->title,
                'slug' => $slug,
                'content' => $request->content,
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
        return Cache::remember('forum.active_threads', 60, function () {
            return Thread::with(['author'])
                ->withCount('posts')
                ->orderByDesc('updated_at')
                ->take(5)
                ->get();
        });
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
