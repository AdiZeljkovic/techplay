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

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(GameCompany::class, 'game_company', 'game_id', 'game_company_id')
            ->withPivot('role');
    }

    public function userGames()
    {
        return $this->hasMany(UserGame::class);
    }
}
