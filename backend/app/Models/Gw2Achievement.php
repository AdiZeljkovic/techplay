<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An achievement, plus the part that is ours.
 *
 * ArenaNet's fields are refreshed from the catalogue and must never be edited
 * here — `CatalogueSync` overwrites them on every game build. The three that
 * survive a refresh are the curation, and they are the reason this model exists
 * at all.
 *
 * §12.1 of the working document: *"Only rank achievements whose completion
 * logic and reward relevance are curated/understood"* and *"Exclude deprecated,
 * hidden, historical or otherwise unsuitable entries."* The engine has been
 * ready for that since it shipped; with `reviewed_at` empty on all 8,339 rows
 * every achievement recommendation carries a "we have not checked this" blocker
 * and sinks to the bottom of the ranking.
 *
 * Reviewing the first hundred unlocks the most actionable thing on a typical
 * account.
 *
 * @property bool $advisor_eligible
 * @property string|null $effort_band
 */
class Gw2Achievement extends Model
{
    public $timestamps = false;

    /** Only the curation. The rest belongs to the catalogue sync. */
    protected $fillable = ['advisor_eligible', 'effort_band', 'reviewed_at'];

    protected $casts = [
        'advisor_eligible' => 'boolean',
        'reviewed_at' => 'datetime',
        'tiers' => 'array',
        'rewards' => 'array',
        'flags' => 'array',
    ];

    /**
     * §12.1 asks for an editorial effort band "rather than fake minute-level
     * precision", and these are its words.
     */
    public const EFFORT_BANDS = [
        'quick' => 'Quick — a few minutes',
        'moderate' => 'Moderate — a session',
        'long' => 'Long — a project',
        'group' => 'Group — needs other people',
        'time_gated' => 'Time-gated — cannot be rushed',
    ];
}
