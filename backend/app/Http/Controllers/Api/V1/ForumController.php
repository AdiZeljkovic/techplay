<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\PostResource;
use App\Http\Resources\V1\ThreadResource;
use App\Models\Category;
use App\Models\ClanMember;
use App\Models\Post;
use App\Models\Tag;
use App\Models\Thread;
use App\Models\User;
use App\Notifications\ForumReplyNotification;
use App\Notifications\MentionNotification;
use App\Notifications\ThreadWatchNotification;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\ClanResourceService;
use App\Services\SanitizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ForumController extends Controller
{
    /**
     * Number of paginated category pages to invalidate on write operations.
     * Wider than the typical thread count per category to avoid stale pages.
     */
    private const CATEGORY_CACHE_PAGES = 20;

    /** Bounty cost to self-pin your own thread for 24 hours. */
    private const SELF_PIN_COST = 100;

    private function clearCategoryPageCache(string $categorySlug): void
    {
        for ($i = 1; $i <= self::CATEGORY_CACHE_PAGES; $i++) {
            Cache::forget("forum.category.{$categorySlug}.page_{$i}");
        }
    }

    /**
     * IDs of clans the current authenticated user belongs to — used to gate
     * visibility of private, clan-linked forum categories.
     */
    private function currentUserClanIds(): array
    {
        if (! Auth::guard('sanctum')->check()) {
            return [];
        }

        return ClanMember::where('user_id', Auth::guard('sanctum')->id())->pluck('clan_id')->all();
    }

    /**
     * Categories list is globally cached, so private-category visibility must
     * be filtered per-request AFTER the cache read, never baked into the cache.
     */
    private function filterPrivateCategories($categories)
    {
        $userClanIds = $this->currentUserClanIds();
        $canSee = fn ($cat) => ! $cat->is_private || in_array($cat->clan_id, $userClanIds);

        return $categories->filter($canSee)->values()->each(function ($cat) use ($canSee) {
            if (isset($cat->children)) {
                $cat->children = $cat->children->filter($canSee)->values();
            }
        });
    }

    /**
     * Notify any @username mentions found in freshly-posted content.
     * Never notifies the author of the content about their own mention.
     */
    private function notifyMentions(string $content, Thread $thread, SanitizationService $sanitizer): void
    {
        $usernames = $sanitizer->extractMentions($content);
        if (empty($usernames)) {
            return;
        }

        $mentioner = Auth::user();
        $preview = substr(strip_tags($content), 0, 100);

        User::whereIn('username', $usernames)
            ->where('id', '!=', $mentioner->id)
            ->get()
            ->each(function (User $mentioned) use ($thread, $mentioner, $preview) {
                $mentioned->notify(new MentionNotification($thread, $mentioner, $preview));
            });
    }

    public function stats()
    {
        $stats = Cache::remember('forum.stats', 30, function () {
            return [
                'total_threads' => Thread::count(),
                'total_posts' => Thread::count() + Post::count(),
                'members' => User::count(),
            ];
        });

        // Online users computed fresh on each request (cheap Redis op)
        Redis::zremrangebyscore('forum:users:online', '-inf', now()->subMinutes(5)->timestamp);
        $stats['online_users'] = (int) Redis::zcard('forum:users:online');

        return response()->json($stats)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function categories()
    {
        // PERFORMANCE: Cache for 60 seconds
        $categories = Cache::remember('forum.categories', 60, function () {
            // Get all forum categories with thread and post counts
            $allForumCategories = Category::where('type', 'forum')
                ->withCount(['threads', 'posts'])
                ->orderBy('id')
                ->get();

            // Get category IDs for batch loading latest threads
            $categoryIds = $allForumCategories->pluck('id');

            // PERFORMANCE: Single query to get latest thread per category (no N+1)
            $latestThreads = Thread::whereIn('category_id', $categoryIds)
                ->with('author:id,username,avatar_url')
                ->select('id', 'title', 'slug', 'category_id', 'author_id', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get()
                ->groupBy('category_id')
                ->map(fn ($threads) => $threads->first());

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

        return response()->json($this->filterPrivateCategories($categories))
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function showCategory($slug)
    {
        $page = request()->get('page', 1);
        $tagSlug = request()->get('tag');
        $cacheKey = "forum.category.{$slug}.page_{$page}".($tagSlug ? ".tag_{$tagSlug}" : '');

        // Reduced cache time to 30 seconds for faster updates
        $data = Cache::remember($cacheKey, 30, function () use ($slug, $tagSlug) {
            Log::info('Fetching category with slug: '.$slug);
            $category = Category::where('slug', $slug)->where('type', 'forum')->first();

            if (! $category) {
                Log::error('Category not found for slug: '.$slug);
                abort(404, 'Category not found');
            }

            $threads = $category->threads()
                ->with(['author', 'latestPost.author', 'tags'])
                ->withCount('posts')
                ->when($tagSlug, function ($q) use ($tagSlug) {
                    $q->whereHas('tags', fn ($tq) => $tq->where('slug', $tagSlug));
                })
                ->orderBy('is_pinned', 'desc')
                ->latest('updated_at')
                ->paginate(20);

            return [
                'category' => $category,
                'threads' => $threads,
            ];
        });

        // Checked per-request (not baked into the shared cache above) so private
        // clan categories never leak to non-members via a cached response.
        if ($data['category']->is_private && ! in_array($data['category']->clan_id, $this->currentUserClanIds())) {
            abort(404, 'Category not found');
        }

        return response()->json($data)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function showThread($slug)
    {
        $thread = Thread::where('slug', $slug)
            ->with([
                'author' => function ($q) {
                    $q->with(['rank', 'roles'])->withCount(['posts', 'threads']);
                },
                'category',
                'tags',
                'game:id,name,slug,background_image',
            ])
            ->withCount(['posts', 'upvotes']) // Add upvotes count
            ->firstOrFail();

        // PERFORMANCE: Use Redis atomic increment instead of sync DB write
        // Views are flushed to DB every 5 minutes by FlushViewCounters job
        Redis::incr("views:thread:{$thread->id}");

        $authUserId = Auth::guard('sanctum')->check() ? Auth::guard('sanctum')->id() : null;

        $thread->is_upvoted = $authUserId
            ? DB::table('thread_upvotes')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $thread->is_watching = $authUserId
            ? DB::table('thread_watchers')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $thread->is_bookmarked = $authUserId
            ? DB::table('thread_bookmarks')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $posts = $thread->posts()
            ->withTrashed()
            ->with([
                'author' => function ($q) {
                    $q->with(['rank', 'roles'])->withCount(['posts', 'threads']);
                },
            ])
            ->paginate(15);

        return response()->json([
            'thread' => new ThreadResource($thread),
            'posts' => PostResource::collection($posts),
        ]);
    }

    public function createPost(Request $request, $slug, SanitizationService $sanitizer)
    {
        $request->validate([
            'content' => 'required|string|min:5|max:10000', // Max 10k chars for post
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

            if (! $hasPermission) {
                return response()->json(['message' => 'Only staff members can reply in News & Announcements.'], 403);
            }
        }

        if ($thread->is_locked) {
            return response()->json(['message' => 'Thread is locked.'], 403);
        }

        Log::info('createPost: Attempting to create', ['user' => Auth::id(), 'thread' => $thread->id]);

        try {
            // RACE CONDITION FIX: Use DB transaction with cache invalidation AFTER commit
            $post = DB::transaction(function () use ($thread, $content) {
                $post = $thread->posts()->create([
                    'content' => $content,
                    'author_id' => Auth::id(),
                    'thread_id' => $thread->id,
                ]);

                // Update thread timestamp inside transaction
                $thread->touch();

                return $post;
            });

            // Cache invalidation AFTER successful transaction commit
            Cache::forget("forum.thread.{$slug}");
            Cache::forget('forum.unanswered_threads');

            Log::info('createPost: Post created', ['id' => $post->id]);

            // Notify thread author if they are not the replier
            $thread->load('author');
            if ($thread->author && $thread->author_id !== Auth::id()) {
                $thread->author->notify(new ForumReplyNotification($post, $thread, Auth::user()));
            }

            // Replying implies interest — auto-watch this thread
            $thread->watchers()->syncWithoutDetaching([Auth::id()]);

            // Notify other watchers (excluding the replier and the thread author, already notified above)
            $watchers = $thread->watchers()
                ->where('users.id', '!=', Auth::id())
                ->where('users.id', '!=', $thread->author_id)
                ->get();
            foreach ($watchers as $watcher) {
                $watcher->notify(new ThreadWatchNotification($post, $thread, Auth::user()));
            }

            $this->notifyMentions($post->content, $thread, $sanitizer);

            $post->load('author.rank');
            $post->author->loadCount(['posts', 'threads']);

            return new PostResource($post);
        } catch (\Throwable $e) {
            Log::error('Failed to create post: '.$e->getMessage());
            try {
                file_put_contents(storage_path('logs/custom_error.log'), $e->getMessage().PHP_EOL.$e->getTraceAsString().PHP_EOL, FILE_APPEND);
            } catch (\Throwable $t) {
            }

            return response()->json(['message' => 'Failed to create post: '.$e->getMessage()], 500);
        }
    }

    public function createThread(Request $request, SanitizationService $sanitizer)
    {
        // Validation must stay outside the try/catch below — otherwise Laravel's
        // ValidationException gets swallowed by the generic \Exception catch and
        // turned into an unhelpful 500 instead of the normal 422 field errors.
        $request->validate([
            'title' => 'required|string|max:255|min:5',
            'content' => 'required|string|min:10|max:20000', // Max 20k chars for thread
            'category_id' => 'required|exists:categories,id',
            'tags' => 'nullable|array|max:5',
            'tags.*' => 'string|max:30',
            'game_id' => 'nullable|exists:games,id',
        ]);

        try {
            // check restriction for "News & Announcements"
            $category = Category::find($request->category_id);
            if ($category && ($category->slug === 'news-announcements' || $category->name === 'News & Announcements')) {
                $user = Auth::user();
                $allowedRoles = ['Super Admin', 'Admin', 'Editor', 'Editor-in-Chief', 'Journalist', 'Moderator'];

                // Check Spatie roles or legacy role column
                $hasPermission = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'editor', 'moderator']);

                if (! $hasPermission) {
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

            $slug = Str::slug($request->title).'-'.uniqid();

            // RACE CONDITION FIX: Use DB transaction with cache invalidation AFTER commit
            $thread = DB::transaction(function () use ($cleanTitle, $slug, $cleanContent, $request) {
                $thread = Thread::create([
                    'title' => $cleanTitle,
                    'slug' => $slug,
                    'content' => $cleanContent,
                    'category_id' => $request->category_id,
                    'author_id' => Auth::id(),
                    'game_id' => $request->game_id,
                ]);

                if (! empty($request->tags)) {
                    $tagIds = collect($request->tags)
                        ->map(fn ($name) => trim($name))
                        ->filter()
                        ->unique()
                        ->take(5)
                        ->map(function ($name) {
                            $tag = Tag::firstOrCreate(
                                ['slug' => Str::slug($name)],
                                ['name' => $name]
                            );

                            return $tag->id;
                        });

                    $thread->tags()->sync($tagIds);
                }

                $thread->watchers()->attach(Auth::id());

                return $thread;
            });

            Log::info('Thread created successfully', ['id' => $thread->id]);

            // Cache invalidation AFTER successful transaction commit
            Cache::forget('forum.categories');
            Cache::forget('forum.active_threads');
            Cache::forget('forum.unanswered_threads');

            // Clear category-specific cache
            $category = Category::find($request->category_id);
            if ($category) {
                $this->clearCategoryPageCache($category->slug);
            }

            $this->notifyMentions($thread->content, $thread, $sanitizer);

            return response()->json($thread, 201);

        } catch (\Exception $e) {
            Log::error('Failed to create thread: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json(['message' => 'Failed to create thread.'], 500);
        }
    }

    /**
     * Recent forum threads discussing a specific game — powers the
     * "Community Discussion" widget on the game's database page.
     */
    public function gameThreads(string $gameSlug)
    {
        $threads = Cache::remember("forum.game_threads.{$gameSlug}", 60, function () use ($gameSlug) {
            return Thread::whereHas('game', fn ($q) => $q->where('slug', $gameSlug))
                ->with(['author', 'category'])
                ->withCount('posts')
                ->orderByDesc('is_pinned')
                ->orderByDesc('updated_at')
                ->take(10)
                ->get();
        });

        return response()->json($threads)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function activeThreads()
    {
        // Cache for 60 seconds
        $threads = Cache::remember('forum.active_threads', 60, function () {
            return Thread::with(['author', 'category'])
                ->withCount('posts')
                ->orderByDesc('updated_at')
                ->take(5)
                ->get();
        });

        return response()->json($threads)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function myWatchedThreads()
    {
        $threads = Auth::user()->watchedThreads()
            ->with(['author', 'category'])
            ->withCount('posts')
            ->orderByDesc('thread_watchers.created_at')
            ->get();

        return response()->json($threads);
    }

    public function myBookmarkedThreads()
    {
        $threads = Auth::user()->bookmarkedThreads()
            ->with(['author', 'category'])
            ->withCount('posts')
            ->orderByDesc('thread_bookmarks.created_at')
            ->get();

        return response()->json($threads);
    }

    public function unansweredThreads()
    {
        // Cache for 60 seconds
        $threads = Cache::remember('forum.unanswered_threads', 60, function () {
            return Thread::with(['author', 'category'])
                ->withCount('posts')
                ->whereDoesntHave('posts')
                ->orderByDesc('created_at')
                ->take(10)
                ->get();
        });

        return response()->json($threads)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function upvote($slug)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $userId = Auth::id();

        $action = DB::transaction(function () use ($thread, $userId) {
            $exists = DB::table('thread_upvotes')
                ->where('user_id', $userId)
                ->where('thread_id', $thread->id)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                DB::table('thread_upvotes')
                    ->where('user_id', $userId)
                    ->where('thread_id', $thread->id)
                    ->delete();
                $delta = -1;
                $action = 'removed';
            } else {
                DB::table('thread_upvotes')->insert([
                    'user_id' => $userId,
                    'thread_id' => $thread->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $delta = 1;
                $action = 'added';
            }

            // Reward the thread author with reputation for receiving an upvote,
            // but never for upvoting your own thread (no self-farming).
            if ($thread->author_id !== $userId) {
                User::where('id', $thread->author_id)->increment('forum_reputation', $delta);

                // Popularity pays the clan exactly once - on the crossing -
                // so toggling an upvote off and on cannot farm it.
                if ($delta === 1) {
                    $upvotes = DB::table('thread_upvotes')->where('thread_id', $thread->id)->count();
                    if ($upvotes === (int) config('clan.thread_popular_upvotes', 5)) {
                        $popularAuthor = User::find($thread->author_id);
                        if ($popularAuthor) {
                            app(ClanResourceService::class)->award($popularAuthor, 'thread_popular');
                        }
                    }
                }
            }

            return $action;
        });

        return response()->json([
            'message' => 'Upvote updated',
            'action' => $action,
            'count' => DB::table('thread_upvotes')->where('thread_id', $thread->id)->count(),
        ]);
    }

    public function watchThread(string $slug)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $userId = Auth::id();

        $isWatching = $thread->watchers()->where('users.id', $userId)->exists();

        if ($isWatching) {
            $thread->watchers()->detach($userId);
        } else {
            $thread->watchers()->attach($userId);
        }

        return response()->json([
            'watching' => ! $isWatching,
            'message' => $isWatching ? 'Stopped watching thread.' : 'Now watching thread.',
        ]);
    }

    public function bookmarkThread(string $slug)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $userId = Auth::id();

        $isBookmarked = $thread->bookmarkedBy()->where('users.id', $userId)->exists();

        if ($isBookmarked) {
            $thread->bookmarkedBy()->detach($userId);
        } else {
            $thread->bookmarkedBy()->attach($userId);
        }

        return response()->json([
            'bookmarked' => ! $isBookmarked,
            'message' => $isBookmarked ? 'Removed bookmark.' : 'Thread bookmarked.',
        ]);
    }

    /**
     * Staff can moderate any thread; a clan's owner/officer can additionally
     * moderate threads within their own clan's private forum category.
     */
    private function canModerateThread(User $user, Thread $thread): bool
    {
        $allowedRoles = ['Super Admin', 'Admin', 'Editor-in-Chief', 'Moderator'];
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if ($isStaff) {
            return true;
        }

        $clanId = $thread->category?->clan_id;
        if (! $clanId) {
            return false;
        }

        $membership = ClanMember::where('clan_id', $clanId)->where('user_id', $user->id)->first();

        return $membership && $membership->isOfficerOrAbove();
    }

    public function pinThread(Request $request, string $slug)
    {
        $user = Auth::user();
        $thread = Thread::where('slug', $slug)->with('category')->firstOrFail();

        if (! $this->canModerateThread($user, $thread)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread->is_pinned = ! $thread->is_pinned;
        $thread->save();

        // Invalidate caches so pinned order/state refreshes everywhere it's shown
        $this->clearCategoryPageCache($thread->category->slug);
        Cache::forget('forum.categories');
        Cache::forget('forum.active_threads');

        return response()->json([
            'is_pinned' => $thread->is_pinned,
            'message' => $thread->is_pinned ? 'Thread pinned.' : 'Thread unpinned.',
        ]);
    }

    /**
     * Spend Bounty to pin your own thread to the top of its category for 24h.
     * Expired self-pins are cleared by the forum:clear-expired-pins schedule.
     */
    public function selfPinThread(Request $request, string $slug, BountyService $bounty)
    {
        $thread = Thread::where('slug', $slug)->with('category')->firstOrFail();
        $user = Auth::user();

        if ($thread->author_id !== $user->id) {
            return response()->json(['message' => 'Only the thread author can self-pin.'], 403);
        }

        if ($thread->is_pinned) {
            return response()->json(['message' => 'This thread is already pinned.'], 422);
        }

        try {
            $bounty->spend($user, self::SELF_PIN_COST, "Self-pinned thread: {$thread->title}");
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $thread->is_pinned = true;
        $thread->pinned_until = now()->addDay();
        $thread->save();

        Cache::forget("forum.thread.{$slug}");
        $this->clearCategoryPageCache($thread->category->slug);
        Cache::forget('forum.categories');
        Cache::forget('forum.active_threads');

        return response()->json([
            'is_pinned' => true,
            'pinned_until' => $thread->pinned_until,
            'balance' => (int) $user->fresh()->bounty_balance,
            'message' => 'Thread pinned for 24 hours.',
        ]);
    }

    public function lockThread(Request $request, string $slug)
    {
        $user = Auth::user();
        $thread = Thread::where('slug', $slug)->with('category')->firstOrFail();

        if (! $this->canModerateThread($user, $thread)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread->is_locked = ! $thread->is_locked;
        $thread->save();

        Cache::forget("forum.thread.{$slug}");
        $this->clearCategoryPageCache($thread->category->slug);
        Cache::forget('forum.categories');

        return response()->json([
            'is_locked' => $thread->is_locked,
            'message' => $thread->is_locked ? 'Thread locked.' : 'Thread unlocked.',
        ]);
    }

    public function deleteThread(Request $request, string $slug)
    {
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Editor-in-Chief', 'Moderator'];

        if (! $user->hasAnyRole($allowedRoles) && ! in_array($user->role, ['admin', 'super_admin', 'moderator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $categorySlug = $thread->category->slug;
        $thread->delete(); // Cascades to posts via FK constraint; ThreadObserver::deleted() clears shared caches

        $this->clearCategoryPageCache($categorySlug);

        return response()->json(['message' => 'Thread deleted.']);
    }

    public function markSolution(Request $request, string $slug, int $postId)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Editor-in-Chief', 'Moderator'];
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if ($thread->author_id !== $user->id && ! $isStaff) {
            return response()->json(['message' => 'Only the thread author or staff can mark a solution.'], 403);
        }

        $post = Post::where('thread_id', $thread->id)->findOrFail($postId);

        if ($post->is_solution) {
            $post->is_solution = false;
            $post->save();
        } else {
            Post::where('thread_id', $thread->id)->where('is_solution', true)->update(['is_solution' => false]);
            $post->is_solution = true;
            $post->save();

            if ($post->author_id !== $thread->author_id) {
                $solutionAuthor = User::find($post->author_id);
                if ($solutionAuthor) {
                    $solutionAuthor->increment('forum_reputation', 10);

                    // Accepted solution = deliberate quality contribution → bounty
                    try {
                        app(BountyService::class)->award($solutionAuthor, 25, 'Answer accepted as solution', 'milestone');
                    } catch (\Throwable) {
                    }

                    try {
                        app(AchievementService::class)->check($solutionAuthor, ['solutions_count']);
                        app(ClanResourceService::class)->award($solutionAuthor, 'forum_solution');
                    } catch (\Throwable) {
                    }
                }
            }
        }

        Cache::forget("forum.thread.{$slug}");

        return response()->json([
            'is_solution' => $post->is_solution,
            'message' => $post->is_solution ? 'Marked as solution.' : 'Unmarked as solution.',
        ]);
    }

    public function updatePost(Request $request, string $slug, int $postId, SanitizationService $sanitizer)
    {
        $request->validate(['content' => 'required|string|min:5|max:10000']);

        $post = Post::findOrFail($postId);
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Moderator'];

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if (! $isOwner && ! $isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->content = $sanitizer->sanitizeRichContent($request->content);
        $post->edited_at = now();
        $post->save();

        Cache::forget("forum.thread.{$slug}");

        $this->notifyMentions($post->content, $post->thread, $sanitizer);

        $post->load('author.rank');
        $post->author->loadCount(['posts', 'threads']);

        return new PostResource($post);
    }

    public function deletePost(Request $request, string $slug, int $postId)
    {
        $post = Post::findOrFail($postId);
        $user = Auth::user();
        $allowedRoles = ['Super Admin', 'Admin', 'Moderator'];

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->hasAnyRole($allowedRoles) || in_array($user->role, ['admin', 'super_admin', 'moderator']);

        if (! $isOwner && ! $isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->delete(); // Soft delete

        // Post counts feed category cards, global stats, and the unanswered-threads
        // list, so all of those need to be invalidated alongside the thread itself.
        Cache::forget("forum.thread.{$slug}");
        Cache::forget('forum.categories');
        Cache::forget('forum.stats');
        Cache::forget('forum.active_threads');
        Cache::forget('forum.unanswered_threads');
        $post->loadMissing('thread.category');
        if ($post->thread?->category) {
            $this->clearCategoryPageCache($post->thread->category->slug);
        }

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
