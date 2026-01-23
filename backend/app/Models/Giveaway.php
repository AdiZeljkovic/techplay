<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Giveaway extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'description',
        'rules',
        'featured_image',
        'prize_name',
        'prize_value',
        'prize_image',
        'starts_at',
        'ends_at',
        'winner_announced_at',
        'status',
        'is_public',
        'max_entries_per_user',
        'winner_id',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'winner_announced_at' => 'datetime',
        'is_public' => 'boolean',
        'prize_value' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($giveaway) {
            if (empty($giveaway->slug)) {
                $giveaway->slug = Str::slug($giveaway->title) . '-' . Str::random(6);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────────────────────────

    public function tasks(): HasMany
    {
        return $this->hasMany(GiveawayTask::class)->orderBy('sort_order');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(GiveawayEntry::class);
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─────────────────────────────────────────────────────────────
    // SCOPES
    // ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active'
            && $this->starts_at <= now()
            && $this->ends_at > now();
    }

    public function hasEnded(): bool
    {
        return $this->ends_at < now() || $this->status === 'ended';
    }

    public function getTimeRemaining(): ?int
    {
        if ($this->hasEnded())
            return null;
        return $this->ends_at->diffInSeconds(now());
    }

    public function getTotalEntryPool(): int
    {
        return $this->entries()->sum('total_points');
    }

    public function getEntryCount(): int
    {
        return $this->entries()->count();
    }

    /**
     * Pick a winner using weighted random selection
     * More points = higher chance to win
     */
    public function pickWinner(): ?User
    {
        $entries = $this->entries()->with('user')->where('total_points', '>', 0)->get();

        if ($entries->isEmpty())
            return null;

        // Build weighted pool
        $pool = [];
        foreach ($entries as $entry) {
            for ($i = 0; $i < $entry->total_points; $i++) {
                $pool[] = $entry->user_id;
            }
        }

        // Random selection
        $winnerId = $pool[array_rand($pool)];

        // Update giveaway
        $this->update([
            'winner_id' => $winnerId,
            'status' => 'ended',
        ]);

        return User::find($winnerId);
    }

    public function getPublicUrl(): string
    {
        return config('app.frontend_url') . '/giveaway/' . $this->slug;
    }
}
