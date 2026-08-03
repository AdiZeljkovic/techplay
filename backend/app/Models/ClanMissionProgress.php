<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClanMissionProgress extends Model
{
    protected $table = 'clan_mission_progress';

    protected $fillable = ['clan_mission_id', 'user_id', 'amount', 'day'];

    // `day` stays a plain Y-m-d string: a date cast serialises to a
    // datetime on write, which breaks firstOrCreate's equality lookup on
    // sqlite and turns the daily-cap upsert into a constraint violation.
    protected $casts = ['amount' => 'integer'];

    public function mission(): BelongsTo
    {
        return $this->belongsTo(ClanMission::class, 'clan_mission_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
