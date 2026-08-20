<?php

namespace App\Models;

use App\Casts\PostgresArray;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'released',
        'rating',
        'cover_url',
        'description',
        'genres',
        'platforms',
        'tags',
        'screenshots',
        'videos',
        'alt_titles',
        'developers',
        'publishers',
        'age_ratings',
        'website',
        'series_key',
        'series_name',
        'ratings_count',
        'attributes',
        'box_art',
        'critic_scores',
        // What the rewritten game page draws, from IGDB.
        'time_to_beat',
        'game_modes',
        'player_perspectives',
        'multiplayer',
        'languages',
        'artworks',
        'similar_games',
        // Written by the release aggregator.
        'match_key',
        'release_precision',
        'hype_score',
        'is_editorial',
        'locked_fields',
    ];

    protected $casts = [
        'genres' => PostgresArray::class,
        'platforms' => PostgresArray::class,
        'tags' => PostgresArray::class,
        'developers' => PostgresArray::class,
        'publishers' => PostgresArray::class,
        'screenshots' => 'array',
        'videos' => 'array',
        'alt_titles' => 'array',
        'age_ratings' => 'array',
        'attributes' => 'array',
        'box_art' => 'array',
        'critic_scores' => 'array',
        'time_to_beat' => 'array',
        'multiplayer' => 'array',
        'languages' => 'array',
        'artworks' => 'array',
        'similar_games' => 'array',
        'game_modes' => PostgresArray::class,
        'player_perspectives' => PostgresArray::class,
        'released' => 'date',
        'rating' => 'float',
        'series_key' => 'integer',
        'hype_score' => 'integer',
        'is_editorial' => 'boolean',
        'locked_fields' => 'array',
    ];

    /** Where this game is sold, one row per store that lists it. */
    public function storeLinks(): HasMany
    {
        return $this->hasMany(GameStoreLink::class);
    }

    /**
     * Who made it and who put it out.
     *
     * `developers` and `publishers` still hold the names, and still feed the
     * game page — this is the same information as something you can click, and
     * as somewhere a reader can go next.
     */
    public function studios(): BelongsToMany
    {
        return $this->belongsToMany(Studio::class)->withPivot('role');
    }

    public function developedBy(): BelongsToMany
    {
        return $this->belongsToMany(Studio::class)->wherePivot('role', 'developer');
    }

    public function publishedBy(): BelongsToMany
    {
        return $this->belongsToMany(Studio::class)->wherePivot('role', 'publisher');
    }

    public function userGames()
    {
        return $this->hasMany(UserGame::class);
    }
}
