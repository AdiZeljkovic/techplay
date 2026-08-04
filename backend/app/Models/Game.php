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
        'moby_id',
        'moby_group_id',
        'moby_group_name',
        'name',
        'released',
        'rating',
        'metacritic',
        'background_image',
        'platforms',
        'short_screenshots',
        'details_data',
        'screenshots_data',
        'movies_data',
        'series_data',
        'suggested_data',
        'additions_data',
        'has_description',
        'genre_names',
        'platform_names',
        'tag_names',
        'details_crawled_at',
        'screenshots_crawled_at',
        'movies_crawled_at',
        'series_crawled_at',
        'suggested_crawled_at',
        'additions_crawled_at',
        'description', // virtual — stored in details_data
        // Written by the release aggregator.
        'match_key',
        'release_precision',
        'hype_score',
        'is_editorial',
        'locked_fields',
    ];

    protected $casts = [
        'platforms' => 'array',
        'short_screenshots' => 'array',
        'details_data' => 'array',
        'screenshots_data' => 'array',
        'movies_data' => 'array',
        'series_data' => 'array',
        'suggested_data' => 'array',
        'additions_data' => 'array',
        'genre_names' => PostgresArray::class,
        'platform_names' => PostgresArray::class,
        'tag_names' => PostgresArray::class,
        'has_description' => 'boolean',
        'details_crawled_at' => 'datetime',
        'screenshots_crawled_at' => 'datetime',
        'movies_crawled_at' => 'datetime',
        'series_crawled_at' => 'datetime',
        'suggested_crawled_at' => 'datetime',
        'additions_crawled_at' => 'datetime',
        'released' => 'date',
        'rating' => 'float',
        'moby_id' => 'integer',
        'moby_group_id' => 'integer',
        'hype_score' => 'integer',
        'is_editorial' => 'boolean',
        'locked_fields' => 'array',
    ];

    /** Where this game is sold, one row per store that lists it. */
    public function storeLinks(): HasMany
    {
        return $this->hasMany(GameStoreLink::class);
    }

    public function getDescriptionAttribute(): ?string
    {
        return data_get($this->details_data, 'description');
    }

    public function setDescriptionAttribute(?string $value): void
    {
        $details = is_array($this->details_data) ? $this->details_data : [];
        $details['description'] = $value;
        $this->details_data = $details;
        $this->attributes['has_description'] = ! empty($value) ? 1 : 0;
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
