<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An expansion or Living World season: the `access` flags that mean an account
 * owns it, what it grants, and what it now comes with. Editorial, sourced per
 * row — see `Ownership`.
 */
class Gw2Product extends Model
{
    protected $fillable = [
        'key', 'name', 'kind', 'sort_order', 'access_flags', 'included_with', 'is_free',
        'grants', 'grants_source_url', 'grants_source_label', 'note', 'source_url', 'source_label', 'checked_at',
    ];

    protected $casts = [
        'access_flags' => 'array',
        'included_with' => 'array',
        'is_free' => 'boolean',
        'checked_at' => 'datetime',
    ];
}
