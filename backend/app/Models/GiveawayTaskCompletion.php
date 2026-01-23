<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiveawayTaskCompletion extends Model
{
    protected $fillable = [
        'entry_id',
        'task_id',
        'completed_at',
        'completed_date',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'completed_date' => 'date',
    ];

    // ─────────────────────────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────────────────────────

    public function entry(): BelongsTo
    {
        return $this->belongsTo(GiveawayEntry::class, 'entry_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(GiveawayTask::class, 'task_id');
    }
}
