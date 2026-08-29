<?php

namespace App\Models;

use App\Casts\PostgresArray;
use App\Services\ContentGameLinker;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Games whose page will actually let itself be indexed.
     *
     * app/games/[slug]/page.tsx emits `noindex` when the description, with its
     * HTML stripped, is 50 characters or shorter. The sitemap was filtering on
     * `whereNotNull('description')` instead, so it submitted 11,259 URLs that
     * the page then refused — the same contradiction /giveaways had, a thousand
     * times over, and paid for out of the crawl budget.
     *
     * The tags have to come off first: 112,554 descriptions contain markup, and
     * 72 of them clear 50 characters only because of it.
     *
     * One scope rather than the condition written out at each call site. It was
     * spelled four times in SitemapController with a comment warning that they
     * must stay identical, which is how they drift.
     */
    public function scopeIndexable(Builder $query): Builder
    {
        // SQLite has no regexp_replace; the test suite only needs the length
        // rule to behave, not the markup stripping.
        if ($query->getConnection()->getDriverName() !== 'pgsql') {
            return $query->whereNotNull('description')
                ->whereRaw('length(description) > 50');
        }

        /*
         * This exact string is also the predicate of `games_indexable_slug_idx`
         * (migration 2026_08_29_030000). Postgres matches a partial index to a
         * query by comparing the parsed expressions, so the two have to stay
         * identical — change the rule here and the index stops being used
         * without any error, and the sitemap goes back to running a regular
         * expression over three hundred thousand descriptions every fifteen
         * minutes. Change both, or neither.
         */
        return $query->whereNotNull('description')
            ->whereRaw("length(regexp_replace(description, '<[^>]+>', '', 'g')) > 50");
    }

    /**
     * Forum threads written about this game.
     *
     * Exists so the game page can carry a `threads_count` and skip asking for
     * a list that is almost always empty — Googlebot alone made 18,835 of
     * those calls in nine days and 99% came back with nothing.
     *
     * Deliberately unfiltered by category visibility. The count decides only
     * whether to ask; the endpoint still applies the viewer's audience rules.
     * An over-count means one wasted request, which is today's behaviour; an
     * under-count would hide real threads, and this cannot under-count.
     */
    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
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
