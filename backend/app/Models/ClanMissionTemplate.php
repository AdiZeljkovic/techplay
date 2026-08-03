<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClanMissionTemplate extends Model
{
    public const TYPES = ['individual', 'squad', 'operation'];

    protected $fillable = [
        'name', 'description', 'type', 'criteria_type', 'base_target',
        'per_member_target', 'scales', 'duration_days',
        'reward_intel', 'reward_materials', 'reward_prestige',
        'stages', 'min_mission_control', 'is_active',
    ];

    protected $casts = [
        'base_target' => 'integer',
        'per_member_target' => 'integer',
        'scales' => 'boolean',
        'duration_days' => 'integer',
        'reward_intel' => 'integer',
        'reward_materials' => 'integer',
        'reward_prestige' => 'integer',
        'stages' => 'array',
        'min_mission_control' => 'integer',
        'is_active' => 'boolean',
    ];

    public function missions(): HasMany
    {
        return $this->hasMany(ClanMission::class, 'template_id');
    }
}
