<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One game's place beside another.
 *
 * Read as "<game> is the <relation> of <related>": a DLC row says `dlc_of`,
 * a remaster says `remaster_of`. Written once, in that direction, and read from
 * both — the reverse is a query, not a second row that could disagree with the
 * first after the next import.
 */
class GameRelation extends Model
{
    protected $fillable = ['game_id', 'related_game_id', 'relation'];

    /** How each relation reads on a page, from the holder's side. */
    public const LABELS = [
        'dlc_of' => 'DLC for',
        'expansion_of' => 'Expansion for',
        'remake_of' => 'Remake of',
        'remaster_of' => 'Remaster of',
        'port_of' => 'Port of',
        'edition_of' => 'Edition of',
        'expanded_from' => 'Expanded from',
        'in_bundle' => 'Included in',
    ];

    /** And from the other side, which is what the parent's page says. */
    public const REVERSE_LABELS = [
        'dlc_of' => 'DLC',
        'expansion_of' => 'Expansions',
        'remake_of' => 'Remade as',
        'remaster_of' => 'Remastered as',
        'port_of' => 'Ported as',
        'edition_of' => 'Editions',
        'expanded_from' => 'Expanded into',
        'in_bundle' => 'Bundle contents',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function related(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'related_game_id');
    }
}
