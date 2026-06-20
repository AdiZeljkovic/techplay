<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestProgress extends Model
{
    protected $fillable = ['user_id', 'quest_id', 'progress', 'completed_at'];

    protected $casts = [
        'progress' => 'integer',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }
}
