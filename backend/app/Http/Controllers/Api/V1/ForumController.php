<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ForumController extends Controller
{
    public function categories()
    {
        // Short cache to allow quick updates
        return Cache::remember('forum.categories', 30, function () {
            $categories = Category::where('type', 'forum')
                ->whereNull('parent_id')
                ->with([
                    'children' => function ($query) {
                        $query->withCount('threads');
                    }
                ])
                ->orderBy('id')
                ->get();

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

        // Reduced cache time to 30 seconds for faster updates
        $data = Cache::remember($cacheKey, 30, function () use ($slug) {
            $category = Category::where('slug', $slug)->where('type', 'forum')->firstOrFail();

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

        $thread->touch();

        // Clear thread cache
        Cache::forget("forum.thread.{$slug}");

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
    }
}

