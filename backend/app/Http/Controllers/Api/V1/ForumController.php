<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ForumCategoryResource;
use App\Http\Resources\V1\ForumThreadCardResource;
use App\Http\Resources\V1\PostResource;
use App\Http\Resources\V1\ThreadResource;
use App\Models\Category;
use App\Models\Poll;
use App\Models\Post;
use App\Models\Tag;
use App\Models\Thread;
use App\Models\User;
use App\Notifications\ForumReplyNotification;
use App\Notifications\MentionNotification;
use App\Notifications\ThreadWatchNotification;
use App\Services\AchievementService;
use App\Services\BountyService;
use App\Services\SanitizationService;
use App\Support\ForumCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ForumController extends Controller
{
    /** Bounty cost to self-pin your own thread for 24 hours. */
    private const SELF_PIN_COST = 100;

    /**
     * Who is reading, on an endpoint that does not require anybody to be.
     *
     * The public forum routes carry no `auth:sanctum` middleware, so the
     * default guard is never resolved on them and only asking sanctum directly
     * finds a bearer token. Asking the default guard afterwards costs nothing
     * and keeps this correct on the authenticated routes too, where the
     * middleware has already made sanctum the default.
     */
    private function viewer(): ?User
    {
        return Auth::guard('sanctum')->user() ?? Auth::user();
    }

    /** Kept as a name the call sites already use; the rules live in ForumCache. */
    private function clearCategoryPageCache(string $categorySlug): void
    {
        ForumCache::forgetCategory($categorySlug);
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
        $stats = Cache::flexible('forum.stats', [30, 300], function () {
            return [
                'total_threads' => Thread::count(),
                // Threads used to be counted here as well, which made the
                // headline number disagree with every board card underneath
                // it — those count replies, through Category::posts().
                'total_posts' => Post::count(),
                'members' => User::count(),
            ];
        });

        // Online users computed fresh on each request (cheap Redis op), and
        // for the same reason as above it is allowed to fail: the forum's
        // headline counts should survive a cache outage, reporting nobody
        // online rather than nothing at all.
        try {
            Redis::zremrangebyscore('forum:users:online', '-inf', now()->subMinutes(5)->timestamp);
            $stats['online_users'] = (int) Redis::zcard('forum:users:online');
        } catch (\Throwable $e) {
            $stats['online_users'] = 0;
        }

        return response()->json($stats)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function categories()
    {
        // Cached per audience, not once for everybody. A single shared entry
        // would hand a moderator's view of the index — private boards and all
        // — to whoever asked next, which is the exact failure the visibility
        // column exists to prevent.
        $viewer = $this->viewer();
        $audience = Category::audienceFor($viewer);

        $categories = Cache::flexible("forum.categories.{$audience}", [60, 600], function () use ($viewer) {
            // Get all forum categories with thread and post counts
            $allForumCategories = Category::where('type', 'forum')
                ->visibleTo($viewer)
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

        return response()->json(ForumCategoryResource::collection($categories)->resolve())
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function showCategory($slug)
    {
        $page = request()->input('page', 1);
        $tagSlug = request()->input('tag');

        // Checked before anything is read or cached. A board nobody is allowed
        // to see answers 404 rather than 403: a refusal confirms the board is
        // there, and for a private room that is itself the leak.
        $viewer = $this->viewer();
        $board = Category::where('slug', $slug)->where('type', 'forum')->first();

        if (! $board || ! $board->isVisibleTo($viewer)) {
            abort(404, 'Category not found');
        }

        $cacheKey = ForumCache::categoryKey($slug, $page, $tagSlug);

        // Reduced cache time to 30 seconds for faster updates
        $data = Cache::remember($cacheKey, 30, function () use ($slug, $tagSlug) {
            // The board's totals were being derived on the client by adding up
            // the twenty rows it had been sent, so a board of a hundred threads
            // announced twenty of them, and its reply and view counts were
            // whatever page you happened to be on. They are counted here, over
            // the whole board, once per cache window.
            $category = Category::where('slug', $slug)
                ->where('type', 'forum')
                ->withCount(['threads', 'posts'])
                ->withSum('threads as views_total', 'view_count')
                ->first();

            if (! $category) {
                abort(404, 'Category not found');
            }

            // `latestPost.author` was eager-loaded for a "last reply" column the
            // board list no longer draws — a join and a second whole User record
            // per row, for nothing.
            $threads = $category->threads()
                ->with(['author', 'tags'])
                ->withCount('posts')
                ->when($tagSlug, function ($q) use ($tagSlug) {
                    $q->whereHas('tags', fn ($tq) => $tq->where('slug', $tagSlug));
                })
                ->orderBy('is_pinned', 'desc')
                ->latest('updated_at')
                ->paginate(20);

            // Both halves are shaped here rather than handed over as models.
            // Returning the paginator meant serializing whole User rows, and
            // the User model leaves `email` visible on purpose so a signed-in
            // visitor can read their own — so this endpoint, which needs no
            // sign-in at all, was publishing the email of every thread author
            // on the board.
            return [
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'rules' => $category->rules,
                    'threads_count' => (int) $category->threads_count,
                    'posts_count' => (int) $category->posts_count,
                    'views_total' => (int) ($category->views_total ?? 0),
                ],
                'threads' => [
                    'data' => ForumThreadCardResource::collection($threads)->resolve(),
                    'current_page' => $threads->currentPage(),
                    'last_page' => $threads->lastPage(),
                    'per_page' => $threads->perPage(),
                    'total' => $threads->total(),
                ],
            ];
        });

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
                'game:id,name,slug,cover_url',
            ])
            ->withCount(['posts', 'upvotes']) // Add upvotes count
            ->firstOrFail();

        // A thread is exactly as visible as the board holding it. Without this
        // a private board leaks through any link to a thread inside it, which
        // is how most of them get found.
        if ($thread->category && ! $thread->category->isVisibleTo($this->viewer())) {
            abort(404, 'Thread not found');
        }

        // Views are counted in Redis and flushed to the database every five
        // minutes by FlushViewCounters.
        //
        // Guarded, because it was not: with Redis unreachable this line threw
        // and the thread page answered 500. A view counter must never be able
        // to take down the page it is counting — losing a count is nothing,
        // losing the thread is the whole point of the page.
        try {
            Redis::incr("views:thread:{$thread->id}");
        } catch (\Throwable $e) {
            Log::warning('View counter unavailable', ['thread' => $thread->id, 'exception' => $e]);
        }

        $authUserId = $this->viewer()?->id;

        $thread->is_upvoted = $authUserId
            ? DB::table('thread_upvotes')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $thread->is_watching = $authUserId
            ? DB::table('thread_watchers')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $thread->is_bookmarked = $authUserId
            ? DB::table('thread_bookmarks')->where('user_id', $authUserId)->where('thread_id', $thread->id)->exists()
            : false;

        $perPage = 15;

        /**
         * A link to one reply has to land on it.
         *
         * Search results and notifications point at `#post-123`, and replies
         * are paginated fifteen at a time — so anything past the first page
         * opened the thread at the top with the quoted reply nowhere on screen.
         * Given `?post=`, the page holding it is worked out here rather than
         * guessed by the client, which cannot see the ordering.
         */
        $page = null;

        if ($postId = request()->integer('post')) {
            // Existence first. Counting rows at or below the id without it
            // meant an invented number counted the whole thread and landed on
            // the last page — and old links outlive the posts they point at,
            // so this is the ordinary case, not the exotic one.
            $belongsHere = $thread->posts()->withTrashed()->whereKey($postId)->exists();

            if ($belongsHere) {
                $position = $thread->posts()->withTrashed()
                    ->where('id', '<=', $postId)
                    ->count();

                $page = (int) ceil($position / $perPage);
            }
        }

        $posts = $thread->posts()
            ->withTrashed()
            ->with([
                'author' => function ($q) {
                    $q->with(['rank', 'roles'])->withCount(['posts', 'threads']);
                },
            ])
            ->paginate($perPage, ['*'], 'page', $page);

        // Reactions for the fifteen replies on screen, in two queries rather
        // than two per reply. Attached to the models so PostResource can read
        // them without knowing where they came from.
        $postIds = collect($posts->items())->pluck('id');

        $counts = DB::table('post_reactions')
            ->whereIn('post_id', $postIds)
            ->groupBy('post_id', 'reaction')
            ->selectRaw('post_id, reaction, count(*) as total')
            ->get()
            ->groupBy('post_id')
            ->map(fn ($rows) => $rows->pluck('total', 'reaction')->map(fn ($n) => (int) $n)->all());

        $mine = $authUserId
            ? DB::table('post_reactions')
                ->whereIn('post_id', $postIds)
                ->where('user_id', $authUserId)
                ->pluck('reaction', 'post_id')
            : collect();

        foreach ($posts as $post) {
            $post->reaction_counts = $counts->get($post->id, []);
            $post->my_reaction = $mine->get($post->id);
        }

        /**
         * The page numbers, stated.
         *
         * `PostResource::collection($paginator)` nested inside a plain array
         * serialises to the items and nothing else — the meta a paginator
         * carries is dropped on the way out. So this endpoint had been
         * answering with a bare list of fifteen, the client's `last_page` was
         * always one, and the pager it draws never appeared: every thread
         * stopped dead at reply fifteen with no way to the rest. Measured, not
         * assumed — the response had two keys and `posts` was a list.
         *
         * Same shape as the board listing uses, so both paginate alike.
         */
        return response()->json([
            'thread' => new ThreadResource($thread),
            'poll' => PollController::present(
                Poll::with('options')->where('thread_id', $thread->id)->first(),
                $authUserId
            ),
            'posts' => [
                'data' => PostResource::collection($posts)->resolve(),
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
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

        // Same rule as reading: a board you cannot see is a board you cannot
        // post into.
        if ($thread->category && ! $thread->category->isVisibleTo(Auth::user())) {
            abort(404, 'Thread not found');
        }

        // Restrict replies in "News & Announcements"
        $category = $thread->category;
        if ($category && ($category->slug === 'news-announcements' || $category->name === 'News & Announcements')) {
            $user = Auth::user();

            $hasPermission = $user->isEditorialStaff() || $user->isForumModerator();

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
            ForumCache::forgetShared();

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
            // The exception message used to be returned to the caller. A driver
            // error names tables and columns, a filesystem error names paths —
            // handed to anyone who could make the write fail on purpose. It
            // belongs in the log, which already has it, and nowhere else.
            Log::error('Failed to create post', [
                'user' => Auth::id(),
                'thread' => $thread->id,
                'exception' => $e,
            ]);

            return response()->json(['message' => 'Could not post that reply. Try again in a moment.'], 500);
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
            $category = Category::find($request->category_id);

            // `exists:categories,id` only proved the row exists. It accepted
            // private categories, and news/review
            // categories that have no forum UI at all — both reachable by
            // guessing an integer.
            if (! $category || in_array($category->type, ['news', 'reviews', 'tech'], true)) {
                return response()->json(['message' => 'That category does not accept threads.'], 422);
            }

            // Reading and writing are the same permission here. Without this a
            // private board is writable by anyone who guesses its id, which is
            // a stranger way in than simply reading it.
            if (! $category->isVisibleTo(Auth::user())) {
                return response()->json(['message' => 'That category does not accept threads.'], 422);
            }

            // check restriction for "News & Announcements"
            if ($category->slug === 'news-announcements' || $category->name === 'News & Announcements') {
                $user = Auth::user();

                // Check Spatie roles or legacy role column
                $hasPermission = $user->isEditorialStaff() || $user->isForumModerator();

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
            ForumCache::forgetShared();

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
        // Same defect as showCategory had, and public in the same way: raw
        // Thread models carry the whole author record, email included.
        $threads = Cache::remember("forum.game_threads.{$gameSlug}", 60, function () use ($gameSlug) {
            $rows = Thread::whereHas('game', fn ($q) => $q->where('slug', $gameSlug))
                ->whereHas('category', fn ($q) => $q->visibleTo($this->viewer()))
                ->with(['author', 'category'])
                ->withCount('posts')
                ->orderByDesc('is_pinned')
                ->orderByDesc('updated_at')
                ->take(10)
                ->get();

            return ForumThreadCardResource::collection($rows)->resolve();
        });

        return response()->json($threads)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function activeThreads()
    {
        // Cache for 60 seconds
        $viewer = $this->viewer();
        $audience = Category::audienceFor($viewer);

        $threads = Cache::remember("forum.active_threads.{$audience}", 60, function () use ($viewer) {
            return Thread::query()
                ->whereHas('category', fn ($q) => $q->visibleTo($viewer))
                ->with(['author', 'category'])
                ->withCount('posts')
                ->orderByDesc('updated_at')
                ->take(5)
                ->get();
        });

        return response()->json(ForumThreadCardResource::collection($threads)->resolve())
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    public function myWatchedThreads()
    {
        $threads = Auth::user()->watchedThreads()
            ->with(['author', 'category'])
            ->withCount('posts')
            ->orderByDesc('thread_watchers.created_at')
            ->get();

        return response()->json(ForumThreadCardResource::collection($threads)->resolve());
    }

    public function myBookmarkedThreads()
    {
        $threads = Auth::user()->bookmarkedThreads()
            ->with(['author', 'category'])
            ->withCount('posts')
            ->orderByDesc('thread_bookmarks.created_at')
            ->get();

        return response()->json(ForumThreadCardResource::collection($threads)->resolve());
    }

    public function unansweredThreads()
    {
        // Cache for 60 seconds
        $viewer = $this->viewer();
        $audience = Category::audienceFor($viewer);

        $threads = Cache::remember("forum.unanswered_threads.{$audience}", 60, function () use ($viewer) {
            return Thread::query()
                ->whereHas('category', fn ($q) => $q->visibleTo($viewer))
                ->with(['author', 'category'])
                ->withCount('posts')
                ->whereDoesntHave('posts')
                ->orderByDesc('created_at')
                ->take(10)
                ->get();
        });

        return response()->json(ForumThreadCardResource::collection($threads)->resolve())
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
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
     * Only staff moderate threads.
     *
     * A clan's officers could also moderate their own private category. With
     * clans gone that branch has no members to check, so moderation is back to
     * the one rule it started with.
     */
    private function canModerateThread(User $user, Thread $thread): bool
    {
        return $user->isForumModerator();
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
        ForumCache::forgetShared();

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
        ForumCache::forgetShared();

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
        ForumCache::forgetShared();

        return response()->json([
            'is_locked' => $thread->is_locked,
            'message' => $thread->is_locked ? 'Thread locked.' : 'Thread unlocked.',
        ]);
    }

    /**
     * PUT /forum/threads/{slug} — edit the thread itself.
     *
     * Every reply on the boards could be edited; the opening post could not,
     * because nothing ever routed to it. An author who mistyped their own
     * title had to delete the thread and start again — and only a moderator
     * can delete, so in practice they had to ask.
     *
     * The slug does not move with the title. It is in every link anyone has
     * already shared, and renaming a thread is not a reason to break them.
     */
    public function updateThread(Request $request, string $slug, SanitizationService $sanitizer)
    {
        $request->validate([
            'title' => 'required|string|min:5|max:255',
            'content' => 'required|string|min:10|max:20000',
        ]);

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        $isOwner = $thread->author_id === $user->id;
        $isStaff = $user->isForumModerator();

        if (! $isOwner && ! $isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($thread->is_locked && ! $isStaff) {
            return response()->json(['message' => 'Thread is locked.'], 403);
        }

        $content = $sanitizer->sanitizeRichContent($request->content);

        if ($sanitizer->detectSpam($content)) {
            return response()->json(['message' => 'Post flagged as spam.'], 422);
        }

        $thread->title = $sanitizer->sanitizeTitle($request->title);
        $thread->content = $content;
        $thread->save();

        Cache::forget("forum.thread.{$slug}");
        $this->clearCategoryPageCache($thread->category->slug);

        $this->notifyMentions($content, $thread, $sanitizer);

        return response()->json([
            'message' => 'Thread updated.',
            'thread' => new ThreadResource($thread->load(['author.rank', 'category', 'tags'])->loadCount(['posts', 'upvotes'])),
        ]);
    }

    public function deleteThread(Request $request, string $slug)
    {
        $user = Auth::user();

        if (! $user->isForumModerator()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread = Thread::where('slug', $slug)->firstOrFail();
        $categorySlug = $thread->category->slug;

        // Soft as of 2026-08-16. This used to remove the row, and the foreign
        // key took every reply with it — so the cheap mistake (deleting one
        // reply) was reversible and the expensive one was not. The replies stay
        // where they are; hiding the thread hides them with it.
        $thread->delete();

        $this->clearCategoryPageCache($categorySlug);

        return response()->json(['message' => 'Thread deleted.']);
    }

    /**
     * Put back a thread a moderator removed.
     *
     * The counterpart deletion never had. Only staff, and only within the
     * window the row still exists — which is forever, since nothing prunes.
     */
    public function restoreThread(Request $request, string $slug)
    {
        $user = Auth::user();

        if (! $user->isForumModerator()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $thread = Thread::onlyTrashed()->where('slug', $slug)->firstOrFail();
        $thread->restore();

        $this->clearCategoryPageCache($thread->category->slug);

        return response()->json(['message' => 'Thread restored.']);
    }

    /**
     * POST /forum/threads/{slug}/merge — fold this thread into another.
     *
     * The same question gets asked three times a week, and until now a
     * moderator's only options were to delete the duplicate (losing whatever
     * had been answered in it) or to leave two half-conversations side by side.
     *
     * The source thread's opening post becomes a reply on the target, so
     * nothing written is lost, and the source is soft-deleted rather than
     * destroyed — a merge decided wrongly can be undone through restore.
     */
    public function mergeThread(Request $request, string $slug)
    {
        $request->validate(['into' => 'required|string|max:255']);

        $user = Auth::user();

        if (! $user->isForumModerator()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $source = Thread::where('slug', $slug)->with('category')->firstOrFail();
        $target = Thread::where('slug', $request->input('into'))->with('category')->firstOrFail();

        if ($source->id === $target->id) {
            return response()->json(['message' => 'A thread cannot be merged into itself.'], 422);
        }

        DB::transaction(function () use ($source, $target) {
            // The opening post is content too; without this step a merge
            // silently drops the question everybody was answering.
            Post::create([
                'thread_id' => $target->id,
                'author_id' => $source->author_id,
                'content' => '<p><em>Merged from "'.e($source->title).'"</em></p>'.$source->content,
                'created_at' => $source->created_at,
                'updated_at' => $source->created_at,
            ]);

            Post::withTrashed()->where('thread_id', $source->id)->update(['thread_id' => $target->id]);

            // Watchers and bookmarks follow the conversation they were
            // following. Ignored on conflict: somebody watching both threads
            // should end up watching one, not fail the merge.
            foreach (['thread_watchers', 'thread_bookmarks'] as $table) {
                $rows = DB::table($table)->where('thread_id', $source->id)->pluck('user_id');

                foreach ($rows as $userId) {
                    DB::table($table)->insertOrIgnore([
                        'thread_id' => $target->id,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table($table)->where('thread_id', $source->id)->delete();
            }

            $source->delete();
            $target->touch();
        });

        $this->clearCategoryPageCache($source->category->slug);
        $this->clearCategoryPageCache($target->category->slug);
        ForumCache::forgetThread($source->slug);
        ForumCache::forgetThread($target->slug);

        return response()->json([
            'message' => 'Thread merged.',
            'into' => $target->slug,
        ]);
    }

    public function markSolution(Request $request, string $slug, int $postId)
    {
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $user = Auth::user();
        $isStaff = $user->isForumModerator();

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

            // Paid once per post, ever. Un-marking refunds nothing, so without
            // this the toggle was a bounty printer: mark, unmark, repeat.
            $alreadyPaid = $post->solution_rewarded_at !== null;

            if ($post->author_id !== $thread->author_id && ! $alreadyPaid) {
                $post->forceFill(['solution_rewarded_at' => now()])->save();

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

        // Bound to the thread in the URL, the way markSolution already is.
        // Unbound, the caller chose {slug} freely — so the cache forget below
        // cleared some other thread's key, leaving the real page serving stale
        // content and letting any user evict arbitrary forum.thread.* entries.
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $post = Post::where('thread_id', $thread->id)->findOrFail($postId);

        $user = Auth::user();

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->isForumModerator();

        if (! $isOwner && ! $isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // A locked thread stops accepting edits too, or locking it only half
        // ends the argument.
        if ($thread->is_locked && ! $isStaff) {
            return response()->json(['message' => 'Thread is locked.'], 403);
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
        // Same binding as updatePost — the post must belong to this thread.
        $thread = Thread::where('slug', $slug)->firstOrFail();
        $post = Post::where('thread_id', $thread->id)->findOrFail($postId);

        $user = Auth::user();

        $isOwner = $post->author_id === $user->id;
        $isStaff = $user->isForumModerator();

        if (! $isOwner && ! $isStaff) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->delete(); // Soft delete

        // Post counts feed category cards, global stats, and the unanswered-threads
        // list, so all of those need to be invalidated alongside the thread itself.
        Cache::forget("forum.thread.{$slug}");
        ForumCache::forgetShared();
        $post->loadMissing('thread.category');
        if ($post->thread?->category) {
            $this->clearCategoryPageCache($post->thread->category->slug);
        }

        return response()->json(['message' => 'Post deleted.']);
    }

    /**
     * Full-text search across threads and replies.
     *
     * Every value reaching SQL below is bound, never concatenated — the raw
     * fragments are here because `to_tsvector`/`plainto_tsquery` have no query
     * builder equivalent, not because the input is trusted.
     *
     * Filters were added 2026-08-16. Without them the only way to narrow a
     * search was to think of a rarer word, which is not searching, it is
     * guessing. Note the coupling this makes explicit: these two functions are
     * PostgreSQL-only, so this endpoint returns a 500 on any other driver — it
     * is the one forum endpoint the SQLite test suite cannot cover.
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:3|max:100',
            'category' => 'nullable|string|max:120',
            'author' => 'nullable|string|max:60',
            'since' => 'nullable|in:day,week,month,year',
        ]);

        $query = $request->input('q');
        $categorySlug = $request->input('category');
        $authorName = $request->input('author');

        $since = match ($request->input('since')) {
            'day' => now()->subDay(),
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            'year' => now()->subYear(),
            default => null,
        };

        $authorId = $authorName
            ? User::where('username', $authorName)->value('id')
            : null;

        // Named so the filter reads the same on both queries below.
        $narrow = function ($builder, string $dateColumn) use ($categorySlug, $authorId, $authorName, $since) {
            if ($categorySlug) {
                $builder->whereHas('thread.category', fn ($q) => $q->where('slug', $categorySlug));
            }

            // An author who does not exist should return nothing, rather than
            // silently widening back to everybody.
            if ($authorName) {
                $builder->where('author_id', $authorId ?? 0);
            }

            if ($since) {
                $builder->where($dateColumn, '>=', $since);
            }

            return $builder;
        };

        $viewer = $this->viewer();

        $threads = Thread::whereRaw(
            "to_tsvector('english', title || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', ?)",
            [$query]
        )
            // Search is the other door into a private board.
            ->whereHas('category', fn ($q) => $q->visibleTo($viewer))
            ->when($categorySlug, fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $categorySlug)))
            ->when($authorName, fn ($q) => $q->where('author_id', $authorId ?? 0))
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->with(['author:id,username,avatar_url', 'category:id,name,slug'])
            ->withCount('posts')
            ->orderByRaw(
                "ts_rank(to_tsvector('english', title || ' ' || coalesce(content, '')), plainto_tsquery('english', ?)) DESC",
                [$query]
            )
            ->limit(20)
            ->get();

        $posts = $narrow(
            Post::whereRaw(
                "to_tsvector('english', coalesce(content, '')) @@ plainto_tsquery('english', ?)",
                [$query]
            )->whereNull('deleted_at')
                ->whereHas('thread.category', fn ($q) => $q->visibleTo($viewer)),
            'created_at'
        )
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
            'filters' => [
                'category' => $categorySlug,
                'author' => $authorName,
                'since' => $request->input('since'),
            ],
        ]);
    }
}
