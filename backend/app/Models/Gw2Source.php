<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Where a rule's claim comes from.
 *
 * §24 of the working document wants every rule to carry its sources, and §25
 * lists provenance as the first control on its largest risk: a wrong
 * recommendation in front of an audience that knows the game better than we do.
 *
 * `checked_at` is the field that matters most and is easiest to leave empty. A
 * source is not a citation, it is a thing that can go stale — a wiki link nobody
 * has opened since a balance patch is worse than no link at all, because it
 * looks like diligence.
 *
 * @property string $label
 * @property string $url
 */
class Gw2Source extends Model
{
    protected $fillable = ['label', 'url', 'kind', 'checked_at', 'notes'];

    protected $casts = ['checked_at' => 'datetime'];

    public const KINDS = [
        'wiki' => 'Guild Wars 2 Wiki',
        'official' => 'ArenaNet / official',
        'community' => 'Community tool or guide',
        'measured' => 'Measured by us against the live API',
        'editorial' => 'TechPlay editorial judgement',
    ];
}
