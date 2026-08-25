<?php

namespace App\Models;

use App\Casts\PostgresArray;
use App\Services\ContentGameLinker;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = [
        'slug',
        // The comparable form of the name, kept in step by the model itself —
        // see the booted() hook below. Fillable so an importer that writes a
        // name and a link_name together is not fighting the hook.
        'link_name',
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
        'engines',
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
        'engines' => PostgresArray::class,
        'released' => 'date',
        'rating' => 'float',
        'series_key' => 'integer',
        'hype_score' => 'integer',
        'is_editorial' => 'boolean',
        'locked_fields' => 'array',
    ];

    /** Where this game is sold, one row per store that lists it. */
    /**
     * `link_name` is the name reduced to what a headline is matched against.
     *
     * Derived here rather than in a migration or an importer, because there
     * are four writers of `games.name` — the store aggregator, the IGDB
     * import, Filament and the collection auto-create — and a value that four
     * places have to remember to set is a value that will drift.
     */
    protected static function booted(): void
    {
        static::saving(function (self $game) {
            if ($game->isDirty('name')) {
                $key = app(ContentGameLinker::class)->comparable((string) $game->name);
                $game->link_name = $key === '' ? null : $key;
            }
        });
    }

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

    /** Store, social and reference links from IGDB — not the aggregator's own. */
    public function links(): HasMany
    {
        return $this->hasMany(GameLink::class);
    }

    /**
     * What this game is beside other games — both directions.
     *
     * Every row hangs on this game and names the other side, so one relation
     * covers "DLC for Hades" and "Hades has this DLC" alike; which of the two
     * a row is, is in its `relation`.
     */
    public function relations(): HasMany
    {
        return $this->hasMany(GameRelation::class, 'game_id');
    }

    public function userGames()
    {
        return $this->hasMany(UserGame::class);
    }
}
