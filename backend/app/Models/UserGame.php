<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserGame extends Model
{
    /**
     * `played` exists because a Steam import has no honest bucket without it.
     *
     * The library arrives with lifetime playtime and nothing else: it does not
     * say whether a game was finished, abandoned, or simply set down. The
     * import used to answer "recently played? then playing, otherwise
     * backlog", which put 1,602 hours of Lord of the Rings Online under
     * "haven't started" — and filled the Backlog Advisor, whose whole job is
     * to pick from the unplayed pile, with games already played to death.
     *
     * `completed` would claim a finish nobody reported, `dropped` an
     * abandonment, `playing` a session happening now. `played` claims only the
     * one thing the platform actually told us.
     */
    public const STATUSES = ['playing', 'played', 'backlog', 'completed', 'wishlist', 'dropped'];

    protected $fillable = [
        'user_id',
        'game_id',
        'status',
        'is_favorite',
        'showcase_order',
        'progress',
        'hours_played',
        // The reader's own word for where they play it — free text they can
        // edit. Which stores *reported* the game is `sources`, and conflating
        // the two is how 37 rows came to wear an Xbox mark over Steam's hours.
        'platform',
        'sources',
        'started_at',
        'completed_at',
        'last_played_at',
        // Minutes per device, as Steam splits them: windows, mac, linux, deck,
        // offline. Only the non-zero ones are stored.
        'device_playtime',
        // Set by the controller on a backlog→completed transition; never
        // accepted from request input (the update validator whitelists fields).
        'from_backlog',
        // Written by SyncSteamLibrary and PresenceService only.
        'playtime_minutes',
        'playtime_source',
        // What the last Steam sync reported. The difference between this and
        // the next reading is what SessionSuggestionService proposes as a
        // session, so it is a floor rather than a fact about the game.
        'playtime_seen_minutes',
        'notify_on_release',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'from_backlog' => 'boolean',
        'playtime_minutes' => 'integer',
        'playtime_seen_minutes' => 'integer',
        'notify_on_release' => 'boolean',
        'showcase_order' => 'integer',
        'progress' => 'integer',
        'hours_played' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_played_at' => 'datetime',
        'device_playtime' => 'array',
        'sources' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Note that a store reported this game, without forgetting the others.
     *
     * Both importers need exactly this and neither should write the array by
     * hand: a game really can be on two stores, and the one that arrives
     * second must not erase the first. Returns the merged set so a caller can
     * put it straight into a create().
     *
     * @param  array<int,string>  $existing
     * @return array<int,string>
     */
    public static function withSource(?array $existing, string $provider): array
    {
        $sources = array_values(array_unique(array_merge($existing ?? [], [$provider])));
        sort($sources);

        return $sources;
    }
}
