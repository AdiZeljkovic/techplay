<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Services\Chronicle\TasteProfileService;
use App\Services\Feed\ContentFeed;
use App\Services\Feed\InterestProfile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Everything the site publishes, as one stream — and the same stream reordered
 * around what a reader has shown interest in.
 *
 * The two are the same content. "For you" hides nothing; it only changes what
 * comes first, and says why.
 */
class FeedController extends Controller
{
    use ApiResponse;

    /** How far the ranker looks before it cuts a page. */
    private const CANDIDATES = 400;

    public function __construct(private readonly ContentFeed $feed) {}

    /**
     * GET /feed/latest?type=all|news|reviews|tech|guides&page=1&limit=24
     *
     * Newest first, across articles and guides alike.
     */
    /**
     * GET /feed/recommended-news — the sidebar that used to ship the four
     * newest articles under the word RECOMMENDED. Now: articles about the
     * games occupying this reader (chronicle affinities, then taste
     * genres), honest fallback to most-read when we do not know them.
     */
    public function recommendedNews(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');
        $exclude = (string) $request->query('exclude', '');
        $taste = app(TasteProfileService::class);

        $personalised = $user && $taste->isPersonalisable($user);

        $articles = collect();

        if ($personalised) {
            $gameIds = array_keys($taste->gameAffinities($user));

            $query = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->where('slug', '!=', $exclude)
                ->with('category:id,name,slug,type');

            if ($gameIds !== []) {
                $articles = (clone $query)->whereIn('game_id', array_slice($gameIds, 0, 50))
                    ->orderByDesc('published_at')->limit(4)->get();
            }

            // Not enough about their exact games — widen to their genres.
            if ($articles->count() < 4 && DB::getDriverName() === 'pgsql') {
                $genres = array_slice(array_keys($taste->genreWeights($user)), 0, 4);
                if ($genres !== []) {
                    $placeholders = implode(',', array_fill(0, count($genres), '?'));
                    $more = (clone $query)
                        ->whereNotIn('id', $articles->pluck('id'))
                        ->whereIn('game_id', function ($q) use ($genres, $placeholders) {
                            $q->select('id')->from('games')
                                ->whereRaw("genres && ARRAY[{$placeholders}]::text[]", $genres);
                        })
                        ->orderByDesc('published_at')->limit(4 - $articles->count())->get();
                    $articles = $articles->concat($more);
                }
            }
        }

        if ($articles->count() < 4) {
            $fill = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->where('slug', '!=', $exclude)
                ->whereNotIn('id', $articles->pluck('id'))
                ->where('published_at', '>=', now()->subDays(14))
                ->with('category:id,name,slug,type')
                ->orderByDesc('views')
                ->limit(4 - $articles->count())
                ->get();
            $articles = $articles->concat($fill);
        }

        return $this->success([
            'personalised' => $personalised,
            'articles' => $articles->map(fn ($a) => [
                'slug' => $a->slug,
                'title' => $a->title,
                'featured_image_url' => is_array($a->featured_image_url) ? ($a->featured_image_url[0] ?? null) : $a->featured_image_url,
                'published_at' => $a->published_at?->toIso8601String(),
                'category' => $a->category?->name,
                'type' => $a->category?->type ?? 'news',
            ])->values()->all(),
        ]);
    }

    public function latest(Request $request): JsonResponse
    {
        $type = ContentFeed::resolveType($request->query('type'));

        if ($type === false) {
            return $this->error('Unknown feed type.', 422);
        }

        $limit = min(48, max(1, (int) $request->query('limit', 24)));
        $page = max(1, (int) $request->query('page', 1));

        $payload = Cache::remember(
            sprintf('feed.latest.v2.%s.%d.%d', $type ?? 'all', $limit, $page),
            300,
            function () use ($type, $limit, $page) {
                $paginator = $this->feed->query($type)->paginate($limit, ['*'], 'page', $page);

                return [
                    'items' => $this->feed->hydrate(collect($paginator->items()))->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'total' => $paginator->total(),
                    ],
                ];
            }
        );

        return $this->success($payload);
    }

    /**
     * GET /feed/personalized?page=1&limit=24
     *
     * The same stream, ordered by what the reader has read, saved, replied to
     * and collected. When there is nothing to go on it says so and hands back
     * the newest — labelled as the newest, not as a recommendation.
     */
    public function personalized(Request $request): JsonResponse
    {
        $userId = Auth::id();

        if (! $userId) {
            return $this->error('Sign in to see your feed.', 401);
        }

        $limit = min(48, max(1, (int) $request->query('limit', 24)));
        $page = max(1, (int) $request->query('page', 1));

        $profile = InterestProfile::for($userId);

        // Nothing known yet: no amount of ranking improves on newest first, and
        // pretending otherwise is the part that would be dishonest.
        if ($profile->isEmpty()) {
            $latest = $this->feed->query()->paginate($limit, ['*'], 'page', $page);

            return $this->success([
                'items' => $this->feed->hydrate(collect($latest->items()))->all(),
                'meta' => [
                    'current_page' => $latest->currentPage(),
                    'last_page' => $latest->lastPage(),
                    'total' => $latest->total(),
                ],
                'personalised' => false,
                'basis' => $profile->basis,
                'interests' => [],
            ]);
        }

        $ranked = $this->rank($profile);
        $slice = $ranked->forPage($page, $limit)->values();

        $items = $this->feed->hydrate($slice->pluck('row'))
            ->values()
            ->map(fn (array $item, int $i) => $item + ['reason' => $slice[$i]['reason']]);

        return $this->success([
            'items' => $items->all(),
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($ranked->count() / $limit)),
                'total' => $ranked->count(),
            ],
            'personalised' => true,
            'basis' => $profile->basis,
            'interests' => $profile->topTags(),
        ]);
    }

    /**
     * Score the recent stream against the profile.
     *
     * Ranking happens in PHP rather than SQL because the weights live in the
     * profile, and a scoring expression built into the query would have to be
     * written twice — once per database dialect — for the sake of a few
     * hundred rows.
     *
     * @return Collection<int,array{row:object,score:float,reason:?string}>
     */
    private function rank(InterestProfile $profile): Collection
    {
        /*
         * The candidates are the same four hundred rows for everybody.
         *
         * Nothing about this query depends on the profile — only the scoring
         * below does — so it was being run once per signed-in reader per page
         * of their feed to fetch a list identical to the one the previous
         * reader had just fetched. Two minutes is short enough that a new
         * article reaches a personalised feed about as fast as it reaches the
         * cached `latest` one above, which holds for five.
         */
        $rows = collect(Cache::remember(
            'feed.candidates.v1.'.self::CANDIDATES,
            120,
            fn () => $this->feed->query()->limit(self::CANDIDATES)->get()->all()
        ));

        return $rows
            ->reject(fn ($row) => $row->kind === 'article' && isset($profile->seen[(int) $row->id]))
            ->map(function ($row) use ($profile) {
                $score = 0.0;
                $reason = null;

                if ($row->category_id && isset($profile->categories[(int) $row->category_id])) {
                    $score += $profile->categories[(int) $row->category_id];
                }

                $matched = [];
                foreach (ContentFeed::tags($row->tags) as $tag) {
                    $key = InterestProfile::normalise($tag);
                    if (isset($profile->tags[$key])) {
                        $score += $profile->tags[$key];
                        $matched[] = $tag;
                    }
                }

                // "Follow" would be a lie — there is nothing to follow. The
                // match came from reading, saving, replying or a collection,
                // and this phrasing is true of all four.
                if ($matched !== []) {
                    $reason = count($matched) === 1
                        ? "Matches your interest in {$matched[0]}"
                        : 'Matches your interest in '.$matched[0].' and '.(count($matched) - 1).' more';
                }

                // Recency is a tie-breaker, not a ranking of its own: a week old
                // and relevant should still beat today and unrelated.
                $days = $row->published_at ? now()->diffInDays($row->published_at, true) : 365;
                $score += max(0, 3 - ($days / 7));

                return ['row' => $row, 'score' => $score, 'reason' => $reason];
            })
            ->sortByDesc('score')
            ->values();
    }
}
