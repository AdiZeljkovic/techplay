<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * One answer in the help centre.
 */
class HelpArticle extends Model
{
    protected $fillable = [
        'help_category_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'sort_order',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'is_noindex',
        'status',
        'published_at',
    ];

    protected $casts = [
        'is_noindex' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(HelpCategory::class, 'help_category_id');
    }

    /**
     * The article's own state, ignoring the topic it sits in.
     *
     * `status` defaults to `draft` and the desk also parks work as
     * `ready_for_review`, so a query that does not say this returns both. A
     * `published_at` in the future counts as not yet published, so a date set
     * ahead of time behaves the way whoever set it expected.
     *
     * This is what the sitemap and the admin want. Public reads want
     * `visible()` below.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    /**
     * What a reader is allowed to see: published, and inside a published topic.
     *
     * Hiding a topic is how an editor takes a whole subject down — a store
     * integration that broke, a feature pulled back. Without this, every answer
     * inside it stays reachable at its own URL while the topic page 404s around
     * them, and the reader who lands there from search is being answered by a
     * page the site believes it has withdrawn.
     *
     * Every public read uses this one.
     */
    public function scopeVisible($query)
    {
        return $query->published()
            ->whereHas('category', fn ($q) => $q->published());
    }

    /**
     * Words a question is made of rather than about.
     *
     * Every word in a query has to appear in the answer, which is precise and
     * brittle in exactly one way: a natural question is half scaffolding. "how
     * do I get bounty" found four answers and *not* the one called "Bounty,
     * and what to spend it on" — because that page never happens to use the
     * word "get", so requiring it threw out the only page the reader wanted.
     *
     * Dropping these leaves the words that carry the question. Kept short and
     * strictly functional: anything that could name a feature stays, because a
     * stop list that swallows a real term is worse than no stop list.
     *
     * @var list<string>
     */
    private const FILLER = [
        'and', 'are', 'but', 'can', 'cannot', 'did', 'does', 'doing', 'for', 'from',
        'get', 'getting', 'got', 'has', 'have', 'how', 'not', 'the', 'their', 'them',
        'there', 'these', 'they', 'this', 'those', 'want', 'was', 'were', 'what',
        'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
    ];

    /**
     * Answers matching what somebody typed, best first.
     *
     * Lives on the model rather than in a controller because two places search
     * this table — the help centre's own results page and the header dropdown
     * on techplay.gg — and a search that ranks differently depending on which
     * box you typed into is a search nobody trusts.
     *
     * ── Two decisions worth stating ──────────────────────────────────────
     *
     * **The operator is chosen at runtime.** `ILIKE` is Postgres's alone. The
     * suite runs on SQLite, where it is a syntax error and every search test
     * would fail on a difference that does not exist in production — while
     * SQLite's own `LIKE` is already case-insensitive for ASCII, so the switch
     * costs nothing in behaviour. This is the same fix the game search carries.
     *
     * **Ranking is `LOWER()`, not the operator.** Both drivers have `LOWER`,
     * so the four tiers below mean the same thing on each. A title that *is*
     * the query outranks one that starts with it, which outranks one that
     * merely contains it, which outranks a hit found only in the body — and
     * the body tier is what makes "why is my library empty" find an answer
     * whose title says something else entirely.
     *
     * No full-text index here on purpose. `to_tsvector` is what the article
     * search uses and is right for tens of thousands of rows; a help centre is
     * a few dozen, and a stemmed index would only add a thing to keep in step.
     */
    public function scopeMatching($query, string $term, bool $all = true)
    {
        $term = trim($term);
        $like = DB::getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
        $lower = mb_strtolower($term);

        /*
         * Word by word, not as one string.
         *
         * The first version of this searched for the whole phrase as a single
         * needle, and it failed at exactly the thing a help search is for.
         * Measured against the live section the day everything was published:
         *
         *     "paypal"             4 results
         *     "xp"                10 results
         *     "steam not syncing"  0
         *     "delete my account"  0
         *
         * Both of those have an answer written for them. Nothing contained the
         * phrase contiguously — the article is called "Delete your account",
         * and somebody in trouble types "my". A search that only rewards
         * guessing our wording is a search that sends people to email.
         *
         * So every word of three letters or more has to appear somewhere in
         * the answer, in any order and any distance apart. Words shorter than
         * that are dropped rather than required: "my", "a" and "is" carry no
         * meaning and would rule out answers that are otherwise exactly right.
         * A query made only of short words falls back to the whole phrase, so
         * "xp" still behaves.
         *
         * Capped at eight words, because the cost is one LIKE per word and a
         * pasted paragraph is not a search.
         */
        $words = array_slice(
            array_filter(
                preg_split('/\s+/u', $lower, -1, PREG_SPLIT_NO_EMPTY) ?: [],
                fn (string $word) => mb_strlen($word) >= 3 && ! in_array($word, self::FILLER, true),
            ),
            0,
            8,
        );

        $needles = $words === [] ? [$lower] : $words;

        $query->where(function ($outer) use ($needles, $like, $all) {
            foreach ($needles as $needle) {
                $wrapped = '%'.$needle.'%';

                $clause = fn ($q) => $q
                    ->where('title', $like, $wrapped)
                    ->orWhere('excerpt', $like, $wrapped)
                    ->orWhere('focus_keyword', $like, $wrapped)
                    ->orWhere('content', $like, $wrapped);

                // AND between words, OR between the columns each is looked for
                // in — so "steam" may be in the title while "syncing" is in the
                // body, and the answer still counts as a match.
                //
                // `$all: false` loosens the first half to OR. That is the
                // second pass, used only when requiring every word found
                // nothing — see the caller.
                $all ? $outer->where($clause) : $outer->orWhere($clause);
            }
        });

        /*
         * Ranking, in two passes.
         *
         * The phrase tiers first, because an answer whose title *is* the
         * question is unarguably the answer. Then, among everything else, how
         * many of the words landed in the title — which is what separates the
         * answer about Steam syncing from the four other answers that merely
         * mention Steam.
         */
        $query->orderByRaw(
            'CASE
                WHEN LOWER(title) = ? THEN 0
                WHEN LOWER(title) LIKE ? THEN 1
                WHEN LOWER(title) LIKE ? THEN 2
                ELSE 3
            END',
            [$lower, $lower.'%', '%'.$lower.'%']
        );

        if ($words !== []) {
            /*
             * Weighted by word length, not counted flat.
             *
             * Counting flat, "how do I get bounty" put "How the forum works"
             * above "Bounty, and what to spend it on": each title carried
             * exactly one of the words, so the two tied and the tie-break was
             * alphabetical. Length is a cheap stand-in for rarity — "bounty"
             * is six characters and tells you what the reader wants, "how" is
             * three and tells you nothing.
             */
            $cases = implode(' + ', array_map(
                fn (string $word) => 'CASE WHEN LOWER(title) LIKE ? THEN '.mb_strlen($word).' ELSE 0 END',
                $words,
            ));

            $query->orderByRaw(
                '('.$cases.') DESC',
                array_map(fn (string $word) => '%'.$word.'%', $words),
            );
        }

        return $query
            ->orderBy('sort_order')
            ->orderBy('title');
    }
}
