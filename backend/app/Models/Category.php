<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'rules',
        'icon',
        'parent_id',
        'type',
        'visibility',
        // seo_title, seo_description, focus_keyword, canonical_url and
        // is_noindex used to sit here. They were columns nothing read: a
        // category's search wording lives in the `page_seo` row for its path,
        // which seoPagePath() below resolves. Dropped 28 Aug 2026.
    ];

    protected $casts = [
    ];

    /**
     * The URL this category is published at.
     *
     * The front end keeps this mapping in `frontend/lib/categories.ts`, where
     * each entry carries the category id and the slug it appears under. It is
     * repeated here because the admin needs to know which `page_seo` row a
     * category's SEO belongs to, and the two must not drift: `news-gaming` is
     * served at /news/gaming, `tech-tech-news` at /hardware/news.
     *
     * Returns null for a type that has no public listing page.
     */
    public function seoPagePath(): ?string
    {
        $section = match ($this->type) {
            'news' => '/news',
            'reviews' => '/reviews',
            'tech' => '/hardware',
            'forum' => '/forum',
            default => null,
        };

        if ($section === null) {
            return null;
        }

        // Forum boards are published under their own slug, unprefixed.
        if ($this->type === 'forum') {
            return $section.'/'.$this->slug;
        }

        $slug = (string) $this->slug;

        // The bare section rows are slugged `news`, `reviews` and `tech` — the
        // type with no suffix — and they are the section page itself.
        if ($slug === $this->type) {
            return $section;
        }

        $prefix = $this->type.'-';

        // `tech-tech-news` is the one row that carries the prefix twice — it is
        // the Tech News category inside the tech section, and it is served at
        // /hardware/news. Everything else strips a single prefix.
        while (str_starts_with($slug, $prefix)) {
            $slug = substr($slug, strlen($prefix));
        }

        // The bare section row (`news`, `reviews`, `tech`) is the section
        // itself, not a category under it.
        return $slug === '' ? $section : $section.'/'.$slug;
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public const VISIBILITY_PUBLIC = 'public';

    /** Signed in, any member. */
    public const VISIBILITY_MEMBERS = 'members';

    /** Forum staff only — the room where moderators discuss the members. */
    public const VISIBILITY_STAFF = 'staff';

    /**
     * Which boards this person is allowed to know exist.
     *
     * Note "know exist": a members-only board is filtered out of the index for
     * a signed-out visitor rather than shown locked, because a lock is itself
     * information — it tells the internet that a private room is there and
     * roughly what it is called.
     */
    public function scopeVisibleTo($query, $user)
    {
        if ($user && method_exists($user, 'isForumModerator') && $user->isForumModerator()) {
            return $query;
        }

        if ($user) {
            return $query->whereIn('visibility', [self::VISIBILITY_PUBLIC, self::VISIBILITY_MEMBERS]);
        }

        return $query->where('visibility', self::VISIBILITY_PUBLIC);
    }

    public function isVisibleTo($user): bool
    {
        return match ($this->visibility ?? self::VISIBILITY_PUBLIC) {
            self::VISIBILITY_STAFF => (bool) ($user && $user->isForumModerator()),
            self::VISIBILITY_MEMBERS => (bool) $user,
            default => true,
        };
    }

    /**
     * The audience a cached payload was built for.
     *
     * Board listings are cached and shared, so a cache key that ignores this
     * would serve a moderator's view of the index to the next visitor — which
     * is the exact failure this whole column exists to prevent.
     */
    public static function audienceFor($user): string
    {
        if ($user && $user->isForumModerator()) {
            return 'staff';
        }

        return $user ? 'members' : 'guest';
    }

    public function threads()
    {
        return $this->hasMany(Thread::class);
    }

    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(Post::class, Thread::class);
    }
}
