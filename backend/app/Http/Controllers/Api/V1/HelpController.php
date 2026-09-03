<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

/**
 * Everything the help centre reads.
 *
 * Four reads and one write, all anonymous. The reader this exists for is very
 * often signed out — the two loudest support questions on the site are "the
 * Create account button does nothing" and "my verification email never came",
 * and neither person has an account to authenticate with. Nothing here asks
 * who you are.
 */
class HelpController extends Controller
{
    use ApiResponse;

    /**
     * What a card needs, and nothing else.
     *
     * `content` is deliberately absent. The guides listing used to paginate
     * whole models and shipped 67 KB for thirteen cards that draw a title and
     * a line of text; a help index lists every answer on the site at once, so
     * the same mistake here would be larger, not smaller.
     */
    private const CARD_COLUMNS = ['id', 'help_category_id', 'title', 'slug', 'excerpt', 'sort_order'];

    /**
     * The whole centre in one response.
     *
     * A help centre is a few dozen rows. Paginating it would cost a round trip
     * per topic to save nothing, and the index page draws every topic with its
     * answers underneath — so it is assembled once and cached for an hour, and
     * the observer drops it the moment an editor changes anything.
     */
    public function index()
    {
        $key = 'help.index.v1';

        $payload = Cache::remember($key, CacheService::TTL_LONG, function () {
            $topics = HelpCategory::published()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->with(['articles' => fn ($q) => $q
                    ->published()
                    ->select(self::CARD_COLUMNS)
                    ->orderBy('sort_order')
                    ->orderBy('title')])
                ->get(['id', 'name', 'slug', 'description', 'icon', 'sort_order']);

            return [
                // A topic with nothing published inside it is a dead end: the
                // card promises help and the page behind it is empty. It stays
                // in the admin, out of the index.
                'topics' => $topics
                    ->filter(fn (HelpCategory $topic) => $topic->articles->isNotEmpty())
                    ->map(fn (HelpCategory $topic) => $this->topicPayload($topic, $topic->articles))
                    ->values()
                    ->all(),
                'popular' => $this->popular(),
            ];
        });

        CacheService::rememberListingKey('help', $key);

        return $this->success($payload);
    }

    /** One topic and the answers filed under it. */
    public function topic(string $slug)
    {
        $key = "help.topic.v1.{$slug}";
        $payload = Cache::get($key);

        if ($payload === null) {
            $topic = HelpCategory::published()
                ->where('slug', $slug)
                /*
                 * Empty is missing, not empty.
                 *
                 * The index already leaves out a topic with nothing published
                 * in it, and so does the sitemap — but the topic's own address
                 * answered 200 with a page saying there was nothing on it,
                 * which is the exact shape of a soft 404. Google files those as
                 * thin rather than absent, and a section that ships several of
                 * them while an editor works through a backlog is a section
                 * teaching a crawler that its URLs are not worth much.
                 *
                 * Same rule in all three places now: a topic exists when there
                 * is something published inside it.
                 */
                ->whereHas('articles', fn ($q) => $q->published())
                ->with(['articles' => fn ($q) => $q
                    ->published()
                    ->select(self::CARD_COLUMNS)
                    ->orderBy('sort_order')
                    ->orderBy('title')])
                ->first(['id', 'name', 'slug', 'description', 'icon', 'sort_order']);

            if (! $topic) {
                return $this->notFound('That help topic does not exist.');
            }

            $payload = $this->topicPayload($topic, $topic->articles);

            Cache::put($key, $payload, CacheService::TTL_LONG);
            // Registered only on a hit. The register is capped at 500 entries,
            // and a crawler walking invented slugs would otherwise fill it with
            // keys for pages that do not exist and push the real ones out.
            CacheService::rememberListingKey('help', $key);
        }

        return $this->success($payload);
    }

    /** One answer, its topic, and the rest of that topic beside it. */
    public function answer(string $slug)
    {
        $key = CacheService::articleShowKey('help', $slug);
        $payload = Cache::get($key);

        if ($payload === null) {
            $article = HelpArticle::visible()
                ->where('slug', $slug)
                ->with('category:id,name,slug,description')
                ->first();

            if (! $article) {
                return $this->notFound('That help article does not exist.');
            }

            $payload = [
                'article' => [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'excerpt' => $article->excerpt,
                    'content' => $article->content,
                    'seo_title' => $article->seo_title,
                    'seo_description' => $article->seo_description,
                    'is_noindex' => (bool) $article->is_noindex,
                    // What a reader wants to know about a help page is whether
                    // it is still true, not when it first appeared. The date on
                    // the page says "Last reviewed" and reads this.
                    'updated_at' => $article->updated_at,
                    'published_at' => $article->published_at,
                    'url' => $this->url($article->category?->slug, $article->slug),
                ],
                'topic' => [
                    'name' => $article->category?->name,
                    'slug' => $article->category?->slug,
                    'description' => $article->category?->description,
                ],
                'related' => HelpArticle::visible()
                    ->where('help_category_id', $article->help_category_id)
                    ->whereKeyNot($article->id)
                    ->orderBy('sort_order')
                    ->orderBy('title')
                    ->limit(4)
                    ->get(self::CARD_COLUMNS)
                    ->map(fn (HelpArticle $a) => $this->cardPayload($a, $article->category?->slug))
                    ->all(),
            ];

            Cache::put($key, $payload, CacheService::TTL_LONG);
        }

        $this->countRead($payload['article']['id']);

        return $this->success($payload);
    }

    /** Search the help centre. */
    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2|max:100']);

        $term = trim((string) $request->input('q'));
        $key = 'help.search.v1.'.md5(mb_strtolower($term));

        $results = Cache::remember($key, CacheService::TTL_MEDIUM, fn () => HelpArticle::visible()
            ->matching($term)
            ->with('category:id,name,slug')
            ->limit(10)
            ->get(self::CARD_COLUMNS)
            ->map(fn (HelpArticle $a) => $this->cardPayload($a, $a->category?->slug, $a->category?->name))
            ->all());

        CacheService::rememberListingKey('help', $key);

        return $this->success([
            'query' => $term,
            'results' => $results,
            'count' => count($results),
        ]);
    }

    /**
     * Was this answer any use.
     *
     * No votes table and no account, because the reader this page is for often
     * has neither — the two biggest questions here are asked by people who
     * cannot sign in. That leaves one counter per direction and one problem:
     * with nothing to identify a voter, one bored person with a mouse can bury
     * the only feedback this section produces.
     *
     * So a vote is remembered for a day against a hashed address. Hashed, and
     * not stored raw, because the section this endpoint serves includes a page
     * about what TechPlay keeps about you — writing an IP into Redis to police
     * a thumbs-up would make that page a lie. `Cache::add()` is the atomic
     * check-and-set, so two clicks arriving together cannot both win.
     *
     * A repeat is not an error. It answers 200 with `counted: false`, the page
     * says thank you either way, and nobody is told they have been fingerprinted.
     */
    public function helpful(Request $request, string $slug)
    {
        $validated = $request->validate(['helpful' => 'required|boolean']);

        $article = HelpArticle::visible()->where('slug', $slug)->first(['id']);

        if (! $article) {
            return $this->notFound('That help article does not exist.');
        }

        $fingerprint = hash('sha256', $request->ip().'|'.config('app.key'));
        $counted = Cache::add("help-vote.{$article->id}.{$fingerprint}", true, CacheService::TTL_DAY);

        if ($counted) {
            try {
                // Buffered in Redis and settled by FlushViewCounters, for the
                // same reason views are: an UPDATE per click serialises the
                // whole route on one row exactly when a page is busiest.
                Redis::incr(($validated['helpful'] ? 'helpful' : 'unhelpful').':help:'.$article->id);
            } catch (\Throwable) {
                // A counter must never take the page down.
                $counted = false;
            }
        }

        return $this->success(['counted' => $counted], 'Thanks for the feedback.');
    }

    // ---------------------------------------------------------------- shapes

    /** @param  Collection<int, HelpArticle>  $articles */
    private function topicPayload(HelpCategory $topic, $articles): array
    {
        return [
            'name' => $topic->name,
            'slug' => $topic->slug,
            'description' => $topic->description,
            'icon' => $topic->icon,
            'articles' => $articles->map(fn (HelpArticle $a) => $this->cardPayload($a, $topic->slug))->all(),
        ];
    }

    private function cardPayload(HelpArticle $article, ?string $topicSlug, ?string $topicName = null): array
    {
        return array_filter([
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'topic_slug' => $topicSlug,
            'topic_name' => $topicName,
            'url' => $this->url($topicSlug, $article->slug),
        ], fn ($value) => $value !== null);
    }

    /**
     * Where an answer lives, as a path.
     *
     * A path and not an absolute URL: every consumer of this controller is the
     * help centre itself, which is already on that host, and a link that names
     * its own hostname is a link that breaks the moment the host changes. The
     * one place an absolute URL is right is the header dropdown on techplay.gg,
     * which is leaving this host — `SearchController::help()` builds it there.
     */
    private function url(?string $topicSlug, string $slug): string
    {
        return '/'.($topicSlug ?? 'help').'/'.$slug;
    }

    /** The most-read answers, for the index. */
    private function popular(int $limit = 6): array
    {
        return HelpArticle::visible()
            ->with('category:id,name,slug')
            ->orderByDesc('views')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->limit($limit)
            ->get(array_merge(self::CARD_COLUMNS, ['views']))
            ->map(fn (HelpArticle $a) => $this->cardPayload($a, $a->category?->slug, $a->category?->name))
            ->all();
    }

    private function countRead(int $id): void
    {
        try {
            Redis::incr('views:help:'.$id);
        } catch (\Throwable) {
            // Same rule as everywhere else: a counter is not worth a 500.
        }
    }
}
