<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
