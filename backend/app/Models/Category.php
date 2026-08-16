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
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
    ];

    protected $casts = [
    ];

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
