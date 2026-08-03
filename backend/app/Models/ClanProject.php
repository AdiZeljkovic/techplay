<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClanProject extends Model
{
    protected $fillable = [
        'clan_id', 'building_key', 'target_level',
        'cost_intel', 'cost_materials', 'funded_intel', 'funded_materials',
        'status', 'started_by', 'finishes_at', 'completed_at',
    ];

    protected $casts = [
        'target_level' => 'integer',
        'cost_intel' => 'integer',
        'cost_materials' => 'integer',
        'funded_intel' => 'integer',
        'funded_materials' => 'integer',
        'finishes_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function starter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function isFullyFunded(): bool
    {
        return $this->funded_intel >= $this->cost_intel
            && $this->funded_materials >= $this->cost_materials;
    }
}
