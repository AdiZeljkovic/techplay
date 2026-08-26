<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameList extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'is_public',
        'cover_image',
        'list_type',
        'category',
        'tags',
        'allow_comments',
        'has_spoilers',
        'is_draft',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'allow_comments' => 'boolean',
        'has_spoilers' => 'boolean',
        'is_draft' => 'boolean',
        'tags' => 'array',
    ];

    /**
     * A type is a promise about shape: a Top 10 holds ten, a Top 25 holds
     * twenty-five. `genre` and `custom` are unbounded.
     */
    public const TYPES = ['top10', 'top25', 'top100', 'genre', 'custom', 'tier'];

    public const TYPE_LIMITS = ['top10' => 10, 'top25' => 25, 'top100' => 100];

    /**
     * The rungs of a tier list, best first.
     *
     * Fixed on purpose. The letters are the format — S above A comes from the
     * Japanese 秀 (shū, "excellent") sitting above a standard A–F report card,
     * and it reached gaming through fighting-game forums in the nineties. A
     * board that renamed them would still be a good list; it would not be a
     * tier list, and it could not be read at a glance against anyone else's.
     */
    public const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'];

    /** A tier list ranks by rung, not by a single running order. */
    public function isTierList(): bool
    {
        return $this->list_type === 'tier';
    }

    /** How many games this list may hold, or null for no ceiling. */
    public function itemLimit(): ?int
    {
        return self::TYPE_LIMITS[$this->list_type] ?? null;
    }

    /** Visible to anyone but the author? A draft never is. */
    public function isPublished(): bool
    {
        return $this->is_public && ! $this->is_draft;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(GameListItem::class)->orderBy('position');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(GameListLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(GameListComment::class);
    }
}
