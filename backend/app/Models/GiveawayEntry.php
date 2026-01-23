<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GiveawayEntry extends Model
{
    protected $fillable = [
        'giveaway_id',
        'user_id',
        'total_points',
        'referral_code',
        'referred_by',
        'referral_count',
        'ip_address',
        'user_agent',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($entry) {
            if (empty($entry->referral_code)) {
                $entry->referral_code = strtoupper(Str::random(8));
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────────────────────────

    public function giveaway(): BelongsTo
    {
        return $this->belongsTo(Giveaway::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(GiveawayEntry::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(GiveawayEntry::class, 'referred_by');
    }

    public function completions(): HasMany
    {
        return $this->hasMany(GiveawayTaskCompletion::class, 'entry_id');
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    public function addPoints(int $points): void
    {
        $maxPoints = $this->giveaway->max_entries_per_user;
        $newTotal = min($this->total_points + $points, $maxPoints);

        $this->update(['total_points' => $newTotal]);
    }

    public function getWinChance(): float
    {
        $totalPool = $this->giveaway->getTotalEntryPool();
        if ($totalPool === 0)
            return 0;

        return round(($this->total_points / $totalPool) * 100, 2);
    }

    public function getCompletedTaskIds(): array
    {
        return $this->completions()->pluck('task_id')->toArray();
    }

    public function getReferralUrl(): string
    {
        return $this->giveaway->getPublicUrl() . '?ref=' . $this->referral_code;
    }
}
