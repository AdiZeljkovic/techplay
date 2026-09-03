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
    public function scopeMatching($query, string $term)
    {
        $term = trim($term);
        $like = DB::getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
        $lower = mb_strtolower($term);
        $contains = '%'.$term.'%';

        return $query
            ->where(fn ($q) => $q
                ->where('title', $like, $contains)
                ->orWhere('excerpt', $like, $contains)
                ->orWhere('focus_keyword', $like, $contains)
                ->orWhere('content', $like, $contains))
            ->orderByRaw(
                'CASE
                    WHEN LOWER(title) = ? THEN 0
                    WHEN LOWER(title) LIKE ? THEN 1
                    WHEN LOWER(title) LIKE ? THEN 2
                    ELSE 3
                END',
                [$lower, $lower.'%', '%'.$lower.'%']
            )
            ->orderBy('sort_order')
            ->orderBy('title');
    }
}
