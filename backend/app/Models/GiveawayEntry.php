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
        'streak_days',
        'last_visit_date',
        'streak_bonus_points',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'last_visit_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($entry) {
            if (empty($entry->referral_code)) {
                $entry->referral_code = strtoupper(Str::random(8));
            }
        });

        // Invalidate leaderboard cache when points change
        static::updated(function ($entry) {
            \Illuminate\Support\Facades\Cache::forget("giveaway:{$entry->giveaway_id}:leaderboard");
        });

        static::created(function ($entry) {
            \Illuminate\Support\Facades\Cache::forget("giveaway:{$entry->giveaway_id}:leaderboard");
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

    // ─────────────────────────────────────────────────────────────
    // STREAK SYSTEM
    // ─────────────────────────────────────────────────────────────

    /**
     * Update daily visit streak
     * Rewards consecutive daily visits with bonus points
     */
    public function updateStreak(): array
    {
        $today = today();
        $lastVisit = $this->last_visit_date;

        // First visit
        if (!$lastVisit) {
            $this->update([
                'streak_days' => 1,
                'last_visit_date' => $today,
            ]);
            return ['streak' => 1, 'bonus' => 0, 'message' => 'Streak started!'];
        }

        // Already visited today
        if ($lastVisit->isSameDay($today)) {
            return ['streak' => $this->streak_days, 'bonus' => 0, 'message' => 'Already visited today'];
        }

        // Consecutive day
        if ($lastVisit->isYesterday()) {
            $newStreak = $this->streak_days + 1;
            $bonus = $this->calculateStreakBonus($newStreak);

            $this->update([
                'streak_days' => $newStreak,
                'last_visit_date' => $today,
                'streak_bonus_points' => $this->streak_bonus_points + $bonus,
            ]);

            if ($bonus > 0) {
                $this->addPoints($bonus);
            }

            return [
                'streak' => $newStreak,
                'bonus' => $bonus,
                'message' => $this->getStreakMessage($newStreak, $bonus),
            ];
        }

        // Streak broken
        $this->update([
            'streak_days' => 1,
            'last_visit_date' => $today,
        ]);

        return ['streak' => 1, 'bonus' => 0, 'message' => 'Streak reset. Visit daily to build it up!'];
    }

    /**
     * Calculate bonus points for streak milestones
     */
    private function calculateStreakBonus(int $streakDays): int
    {
        $milestones = [
            3 => 5,   // 3-day streak: +5 pts
            7 => 10,  // 7-day streak: +10 pts
            14 => 20, // 14-day streak: +20 pts
            30 => 50, // 30-day streak: +50 pts
        ];

        return $milestones[$streakDays] ?? 0;
    }

    /**
     * Get streak message for milestones
     */
    private function getStreakMessage(int $streakDays, int $bonus): string
    {
        if ($bonus > 0) {
            return "🔥 {$streakDays}-day streak! Bonus: +{$bonus} points!";
        }

        return "Day {$streakDays} streak!";
    }

    /**
     * Check if user can claim daily bonus
     */
    public function canClaimDailyBonus(): bool
    {
        if (!$this->last_visit_date) {
            return true;
        }

        return !$this->last_visit_date->isToday();
    }
}
