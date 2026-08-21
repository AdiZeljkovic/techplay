<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One game's place beside another, written from our game's side.
 *
 * The other side is a name and, when we have the game, a link. Most of what
 * IGDB relates a game to is DLC, a mod or a pack — none of which this catalogue
 * imports as pages — so requiring both ends to be ours would mean a game could
 * never list its own add-ons.
 */
class GameRelation extends Model
{
    protected $fillable = ['game_id', 'relation', 'other_igdb_id', 'other_name', 'other_game_id'];

    /**
     * Every fact, in both directions, with the words a page uses.
     *
     * The key is the relation as stored; `reverse` is the same fact seen from
     * the other game, which is what gets written on that game's own row.
     */
    public const KINDS = [
        'dlc_of' => ['label' => 'DLC for', 'reverse' => 'has_dlc'],
        'has_dlc' => ['label' => 'DLC', 'reverse' => 'dlc_of'],

        'expansion_of' => ['label' => 'Expansion for', 'reverse' => 'has_expansion'],
        'has_expansion' => ['label' => 'Expansions', 'reverse' => 'expansion_of'],

        'remake_of' => ['label' => 'Remake of', 'reverse' => 'remade_as'],
        'remade_as' => ['label' => 'Remade as', 'reverse' => 'remake_of'],

        'remaster_of' => ['label' => 'Remaster of', 'reverse' => 'remastered_as'],
        'remastered_as' => ['label' => 'Remastered as', 'reverse' => 'remaster_of'],

        'port_of' => ['label' => 'Port of', 'reverse' => 'ported_as'],
        'ported_as' => ['label' => 'Ported as', 'reverse' => 'port_of'],

        'edition_of' => ['label' => 'Edition of', 'reverse' => 'has_edition'],
        'has_edition' => ['label' => 'Editions', 'reverse' => 'edition_of'],

        'expanded_from' => ['label' => 'Expanded from', 'reverse' => 'expanded_into'],
        'expanded_into' => ['label' => 'Expanded into', 'reverse' => 'expanded_from'],

        'in_bundle' => ['label' => 'Included in', 'reverse' => 'bundle_contains'],
        'bundle_contains' => ['label' => 'Bundle contents', 'reverse' => 'in_bundle'],

        'mod_of' => ['label' => 'Mod for', 'reverse' => 'has_mod'],
        'has_mod' => ['label' => 'Mods', 'reverse' => 'mod_of'],

        'episode_of' => ['label' => 'Episode of', 'reverse' => 'has_episode'],
        'has_episode' => ['label' => 'Episodes', 'reverse' => 'episode_of'],

        'season_of' => ['label' => 'Season of', 'reverse' => 'has_season'],
        'has_season' => ['label' => 'Seasons', 'reverse' => 'season_of'],

        'in_pack' => ['label' => 'Part of', 'reverse' => 'pack_contains'],
        'pack_contains' => ['label' => 'Pack contents', 'reverse' => 'in_pack'],

        'update_of' => ['label' => 'Update for', 'reverse' => 'has_update'],
        'has_update' => ['label' => 'Updates', 'reverse' => 'update_of'],
    ];

    public static function label(string $relation): string
    {
        return self::KINDS[$relation]['label'] ?? $relation;
    }

    public static function reverse(string $relation): ?string
    {
        return self::KINDS[$relation]['reverse'] ?? null;
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /** The other game, when this catalogue has it. Null is the common case. */
    public function other(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'other_game_id');
    }
}
