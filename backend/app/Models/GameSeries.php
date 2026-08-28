<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A game series, addressable.
 *
 * Rebuilt from `games` by `games:sync-series`; see the migration for why the
 * slug is stored rather than derived.
 */
class GameSeries extends Model
{
    protected $table = 'game_series';

    protected $fillable = [
        'series_key',
        'name',
        'slug',
        'games_count',
        'first_year',
        'last_year',
        'described_count',
    ];

    protected $casts = [
        'series_key' => 'integer',
        'games_count' => 'integer',
        'first_year' => 'integer',
        'last_year' => 'integer',
        'described_count' => 'integer',
    ];

    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'series_key', 'series_key');
    }

    /**
     * Series worth giving a search engine.
     *
     * Two games and a page is a list; three is a series. And a series whose
     * every game is a bare title with no description has nothing on the page
     * but a grid of covers, which is the thin archive Google already ignores —
     * the same bar `Game::indexable()` sets for a single title.
     */
    public function scopeIndexable(Builder $query): Builder
    {
        return $query->where('games_count', '>=', 3)->where('described_count', '>=', 1);
    }
}
