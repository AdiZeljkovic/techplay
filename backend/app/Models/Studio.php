<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A company that made or published games.
 *
 * The two relations that matter are kept apart rather than merged behind one
 * `games()`, because the studio page shows them apart and a reader asking what
 * Arkane made does not want Bethesda's catalogue mixed into the answer.
 */
class Studio extends Model
{
    use HasFactory;

    protected $fillable = [
        'igdb_id', 'name', 'slug', 'description', 'logo_url',
        'country', 'founded', 'website', 'parent_id',
        'status', 'changed_at', 'became_studio_id', 'kind',
        'games_count', 'developed_count', 'published_count',
        'ported_count', 'supported_count', 'indexable',
    ];

    protected $casts = [
        'founded' => 'date',
        'changed_at' => 'date',
        'indexable' => 'boolean',
        'igdb_id' => 'integer',
        'country' => 'integer',
        'games_count' => 'integer',
        'developed_count' => 'integer',
        'published_count' => 'integer',
        'ported_count' => 'integer',
        'supported_count' => 'integer',
    ];

    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class)->withPivot('role');
    }

    public function developed(): BelongsToMany
    {
        return $this->belongsToMany(Game::class)->wherePivot('role', 'developer');
    }

    public function published(): BelongsToMany
    {
        return $this->belongsToMany(Game::class)->wherePivot('role', 'publisher');
    }

    /** Brought somebody else's game to another platform. */
    public function ported(): BelongsToMany
    {
        return $this->belongsToMany(Game::class)->wherePivot('role', 'porting');
    }

    /** Worked on it without being the studio whose game it is. */
    public function supported(): BelongsToMany
    {
        return $this->belongsToMany(Game::class)->wherePivot('role', 'supporting');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function subsidiaries(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** What it turned into, when it was renamed or merged away. */
    public function became(): BelongsTo
    {
        return $this->belongsTo(self::class, 'became_studio_id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
