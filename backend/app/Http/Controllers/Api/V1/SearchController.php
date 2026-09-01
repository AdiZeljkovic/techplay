<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Game;
use App\Models\User;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    /**
     * Search articles across News, Reviews, Tech, and Guides
     * Returns max 10 results for quick autocomplete
     */
    public function articles(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        ReadingController::rememberSearch($request->user()?->id, $query);
        $cacheKey = 'search.articles.'.md5($query);

        // Cache for 60 seconds to prevent hammering
        $result = Cache::remember($cacheKey, 60, function () use ($query) {
            $results = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->whereRaw("to_tsvector('english', title || ' ' || coalesce(excerpt, '')) @@ plainto_tsquery('english', ?)", [$query])
                // Only include articles from content categories (news, reviews, tech)
                ->whereHas('category', function ($q) {
                    $q->whereIn('type', ['news', 'reviews', 'tech']);
                })
                ->with(['category:id,name,slug,type'])
                ->select('id', 'title', 'slug', 'excerpt', 'featured_image_url', 'category_id', 'published_at')
                ->orderByDesc('published_at')
                ->limit(10)
                ->get();

            return [
                'results' => $results->map(function ($article) {
                    // Build URL based on category type
                    $type = $article->category?->type ?? 'news';
                    $url = match ($type) {
                        'reviews' => "/reviews/{$article->slug}",
                        'tech' => "/hardware/{$article->slug}",
                        default => "/news/{$article->slug}",
                    };

                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'excerpt' => $article->excerpt ? Str::limit(strip_tags($article->excerpt), 80) : null,
                        'image' => $article->featured_image_url,
                        'category' => $article->category?->name,
                        'category_slug' => $article->category?->slug,
                        'type' => $type,
                        'url' => $url,
                    ];
                }),
                'count' => $results->count(),
            ];
        });

        return response()->json($result)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Search the game database for the global search dropdown.
     * Uses the trigram index on games.name; max 5 results.
     */
    public function games(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        ReadingController::rememberSearch($request->user()?->id, $query);
        $cacheKey = 'search.games.'.md5($query);

        $result = Cache::remember($cacheKey, 60, function () use ($query) {
            /*
             * ILIKE is Postgres's. The suite runs on SQLite, where the operator
             * does not exist and this query quietly matched nothing — so the
             * ranking below could not be tested at all until it was asked for
             * by name. SQLite's own LIKE is already case-insensitive for ASCII,
             * which is what the comparison needs.
             */
            $like = DB::getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

            $results = Game::query()
                ->where('name', $like, "%{$query}%")
                ->whereNotNull('description')
                /*
                 * Where the word lands, before how well the game was reviewed.
                 *
                 * This used to sort on rating alone, so anything with the typed
                 * word anywhere in its title competed on equal footing. Typing
                 * "Half" offered Rise of the Half Moon, Dragon Half and a game
                 * called Half — and not Half-Life, which the catalogue's own
                 * list endpoint returns first. Somebody typing four letters is
                 * naming a game, not asking for the best-reviewed title that
                 * happens to contain them.
                 *
                 * Three tiers: the title starts with what was typed, the word
                 * starts somewhere inside the title, or it merely appears.
                 * Rating breaks ties, which is what puts Half-Life above the
                 * obscure game named exactly Half.
                 */
                ->orderByRaw(
                    "CASE WHEN name {$like} ? THEN 0 WHEN name {$like} ? THEN 1 ELSE 2 END",
                    ["{$query}%", "% {$query}%"]
                )
                // The game before its editions — same demote as the catalogue list.
                ->when(DB::getDriverName() === 'pgsql', fn ($q) => $q
                    ->orderByRaw("(genres && ARRAY['Add-on','Compilation','Special edition']::text[])::int asc"))
                /*
                 * Unrated last, then best first.
                 *
                 * `ORDER BY rating DESC` puts NULL *first* in Postgres, and
                 * most of a 332,000-row catalogue has no rating at all — so the
                 * tie-break handed every position to games nobody has scored.
                 * "Half" came back as Half Minute Hero, Halfbrick Rocket
                 * Racing, Half and HalfMoon Adventures, all unrated, with
                 * Half-Life and its 7.7 nowhere in the five.
                 *
                 * `rating IS NULL` sorts false before true in both Postgres and
                 * SQLite, which NULLS LAST does not.
                 */
                ->orderByRaw('(rating IS NULL) asc')
                ->orderByDesc('rating')
                ->select('id', 'name', 'slug', 'cover_url', 'released', 'rating')
                ->limit(5)
                ->get();

            return [
                'results' => $results->map(fn ($game) => [
                    'id' => $game->id,
                    'title' => $game->name,
                    'slug' => $game->slug,
                    'excerpt' => null,
                    'image' => $game->cover_url,
                    'category' => $game->released ? 'Game · '.$game->released->format('Y') : 'Game',
                    'category_slug' => 'games',
                    'type' => 'game',
                    'url' => "/games/{$game->slug}",
                ]),
                'count' => $results->count(),
            ];
        });

        // What a signed-in user searched for — and found — used to vanish
        // with the Redis TTL. Now it is a chronicle signal.
        $firstId = $result['results'][0]['id'] ?? null;
        $userId = $request->user('sanctum')?->id;
        if ($firstId && $userId) {
            try {
                DB::table('player_signals')->insertOrIgnore([
                    'user_id' => $userId,
                    'game_id' => $firstId,
                    'type' => 'search',
                    'weight' => 0.6,
                    'day' => now()->toDateString(),
                    'meta' => json_encode(['q' => Str::limit($query, 60)]),
                ]);
            } catch (\Throwable) {
                // learning must never break search
            }
        }

        return response()->json($result)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Search community members for the global search dropdown (max 5).
     */
    public function users(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        $cacheKey = 'search.users.'.md5($query);

        $result = Cache::remember($cacheKey, 60, function () use ($query) {
            $results = User::query()
                ->where(function ($q) use ($query) {
                    $q->byUsername('ILIKE', "%{$query}%")
                        ->orWhere('display_name', 'ILIKE', "%{$query}%");
                })
                // Friends-only profiles aren't browsable. A direct link still
                // works — it lands on the locked teaser with "Add Friend".
                ->where(fn ($q) => $q->whereNull('profile_visibility')->orWhere('profile_visibility', 'public'))
                ->with('rank:id,name')
                ->orderByDesc('xp')
                ->limit(5)
                ->get(['id', 'username', 'display_name', 'avatar_url', 'xp', 'rank_id']);

            return [
                'results' => $results->map(fn ($u) => [
                    'id' => $u->id,
                    'title' => $u->display_name ?: $u->username,
                    'slug' => $u->username,
                    'excerpt' => null,
                    'image' => $u->avatar_url,
                    'category' => trim('Lv '.app(LevelService::class)->forXp($u->xp).' · '.($u->rank->name ?? 'Member')),
                    'category_slug' => 'users',
                    'type' => 'user',
                    'url' => "/profile/{$u->username}",
                ]),
                'count' => $results->count(),
            ];
        });

        return response()->json($result)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
