<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One dated change to the game, for a returning player — in our words, with
 * the page it was written from. See `WhatsNew`.
 */
class Gw2Change extends Model
{
    protected $fillable = ['happened_on', 'title', 'summary', 'applies_to', 'category', 'source_url', 'source_label', 'is_published'];

    protected $casts = [
        'happened_on' => 'date',
        'is_published' => 'boolean',
    ];
}
