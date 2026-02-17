<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WowCharacter extends Model
{
    protected $table = 'user_wow_characters';

    protected $fillable = [
        'user_id',
        'character_name',
        'realm_slug',
        'region',
        'character_class',
        'faction',
        'level',
        'item_level',
        'avatar_url',
        'is_main',
        'last_analyzed_at',
    ];

    protected $casts = [
        'is_main' => 'boolean',
        'last_analyzed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper: Full character identifier for API calls
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->character_name}-{$this->realm_slug}";
    }
}
