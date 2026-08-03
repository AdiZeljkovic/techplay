<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClanMission extends Model
{
    protected $fillable = [
        'clan_id', 'template_id', 'target', 'progress', 'stage', 'status',
        'starts_at', 'ends_at', 'completed_at',
    ];

    protected $casts = [
        'target' => 'integer',
        'progress' => 'integer',
        'stage' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ClanMissionTemplate::class, 'template_id');
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(ClanMissionProgress::class);
    }
}
