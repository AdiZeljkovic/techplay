<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quest extends Model
{
    protected $fillable = [
        'name', 'description', 'icon', 'type', 'criteria_type', 'criteria_value',
        'xp_reward', 'bounty_reward', 'is_active', 'expires_at', 'season_id',
    ];

    protected $casts = [
        'criteria_value' => 'integer',
        'xp_reward' => 'integer',
        'bounty_reward' => 'integer',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(QuestProgress::class);
    }
}
