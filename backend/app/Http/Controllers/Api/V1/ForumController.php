<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ForumController extends Controller
{
    public function categories()
    {
        // Cache for short duration to allow immediate updates during dev
        return \Illuminate\Support\Facades\Cache::remember('forum.categories', 5, function () {
            // Include latest thread logic inside cache
            $categories = Category::where('type', 'forum')
                ->whereNull('parent_id') // Get root categories (Lounge, Platforms, etc.)
                ->with([
                    'children' => function ($query) {
                        $query->withCount('threads'); // Count threads in subcategories
                    }
                ])
                ->orderBy('id') // Or order column if added, for now ID or Name
                ->get();

            // We need to attach latest thread to subcategories usually, but let's stick to requested structure.
            // The previous code did ForumCategory::orderBy('order').
            // Let's iterate children to get stats.

            $categories->each(function ($parent) {
                if ($parent->children) {
                    $parent->children->each(function ($child) {
                        $child->latest_thread = $child->threads()->with('author')->latest()->first();
                    });
                }
            });

            return $categories;
        });
    }

    public function showCategory($slug)
    {
        $page = request()->get('page', 1);
        $cacheKey = "forum.category.{$slug}.page_{$page}";

        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($slug) {
            $category = Category::where('slug', $slug)->where('type', 'forum')->firstOrFail();

            $threads = $category->threads()
                ->with(['author', 'latestPost.author']) // Changed 'user' to 'author' to match existing relations
                ->withCount('posts')
                ->orderBy('is_pinned', 'desc') // Kept original order by pinned
                ->latest('updated_at') // Sort by latest activity
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
            ->withCount('posts')
            ->firstOrFail();

        $thread->increment('view_count');

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

        $post = $thread->posts()->create([
            'content' => $request->content,
            'author_id' => Auth::id(),
            'thread_id' => $thread->id
        ]);

        $thread->touch(); // Update updated_at of thread

        // TODO: Award reputation

        return response()->json($post, 201);
    }

    public function createThread(Request $request)
    {
        $request->validate([
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

        // Also create the first post if desired, or treat thread content as OP.
        // For this implementation, thread has content.

        return response()->json($thread, 201);
    }
}
