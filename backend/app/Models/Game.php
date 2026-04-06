<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $fillable = [
        'slug',
        'rawg_id',
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
        'details_crawled_at',
        'screenshots_crawled_at',
        'movies_crawled_at',
        'series_crawled_at',
        'suggested_crawled_at',
        'additions_crawled_at',
    ];

    protected $casts = [
        'platforms'              => 'array',
        'short_screenshots'      => 'array',
        'details_data'           => 'array',
        'screenshots_data'       => 'array',
        'movies_data'            => 'array',
        'series_data'            => 'array',
        'suggested_data'         => 'array',
        'additions_data'         => 'array',
        'details_crawled_at'     => 'datetime',
        'screenshots_crawled_at' => 'datetime',
        'movies_crawled_at'      => 'datetime',
        'series_crawled_at'      => 'datetime',
        'suggested_crawled_at'   => 'datetime',
        'additions_crawled_at'   => 'datetime',
        'released'               => 'date',
        'rating'                 => 'decimal:2',
    ];
}
