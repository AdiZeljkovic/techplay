<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokenLink extends Model
{
    protected $fillable = [
        'article_id',
        'url',
        'status_code',
        'error_message',
        'last_checked_at',
        'is_fixed',
    ];

    protected $casts = [
        'is_fixed' => 'boolean',
        'last_checked_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function scopeUnfixed($query)
    {
        return $query->where('is_fixed', false);
    }

    public function scopeByStatus($query, int $code)
    {
        return $query->where('status_code', $code);
    }

    public function markAsFixed(): void
    {
        $this->update(['is_fixed' => true]);
    }
}
