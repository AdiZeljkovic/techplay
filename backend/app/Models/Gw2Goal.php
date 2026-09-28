<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Something a player is trying to get done.
 *
 * A row rather than an enum, because which goals exist is an editorial decision
 * about the game and the game changes. The document's §9 names five engines;
 * these are the ones the current rules can actually serve, and adding a sixth
 * is a row plus the rules that advance it.
 *
 * @property string $slug
 * @property string $title
 */
class Gw2Goal extends Model
{
    protected $fillable = ['slug', 'title', 'summary', 'domain', 'icon', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
