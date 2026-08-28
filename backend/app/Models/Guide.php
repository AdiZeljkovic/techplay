<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guide extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'steps',
        'excerpt',
        'featured_image_url',
        'featured_image_width',
        'featured_image_height',
        'difficulty', // beginner, intermediate, advanced
        'author_id',
        'game_id',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'status',
        'published_at',
    ];

    protected $casts = [
        'steps' => 'array',
        'is_noindex' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(GuideVote::class);
    }

    /**
     * What a reader is allowed to see.
     *
     * `status` defaults to `draft`, and the admin also parks work as
     * `ready_for_review`, so a public query that does not say this returns both.
     * Every other reader of this table already draws the line — the newsroom,
     * the sitemap, the author page — and the public API was the one that did
     * not, which is how unfinished guides were reachable at /guides and
     * /guides/{slug}.
     *
     * A `published_at` in the future is treated as not yet published, so a date
     * set ahead of time behaves the way whoever set it expected.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
