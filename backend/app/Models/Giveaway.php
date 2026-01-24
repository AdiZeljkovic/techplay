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

    public function prizeTiers(): HasMany
    {
        return $this->hasMany(GiveawayPrizeTier::class)->orderBy('sort_order');
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
        $winner = User::find($winnerId);

        // Update giveaway
        $this->update([
            'winner_id' => $winnerId,
            'status' => 'ended',
        ]);

        // Send winner notification
        if ($winner && $winner->email) {
            $winner->notify(new \App\Notifications\GiveawayWinnerNotification($this));
        }

        return $winner;
    }

    /**
     * Pick winners for all prize tiers using weighted random selection
     * Returns array of ['tier_id' => [user_ids]]
     */
    public function pickWinnersByTiers(): array
    {
        $tiers = $this->prizeTiers()->orderBy('sort_order')->get();

        if ($tiers->isEmpty()) {
            // Fallback to single winner if no tiers defined
            $winner = $this->pickWinner();
            return $winner ? ['single' => [$winner->id]] : [];
        }

        $selectedWinners = [];

        foreach ($tiers as $tier) {
            $tierWinners = [];
            $qualifiedEntries = $tier->getQualifiedEntries()->with('user')->get();

            if ($qualifiedEntries->isEmpty()) {
                continue;
            }

            // Build weighted pool for this tier
            $pool = [];
            foreach ($qualifiedEntries as $entry) {
                for ($i = 0; $i < $entry->total_points; $i++) {
                    $pool[] = $entry->user_id;
                }
            }

            // Pick multiple winners for this tier
            for ($i = 0; $i < $tier->winner_count; $i++) {
                if (empty($pool)) {
                    break;
                }

                // Random selection
                $randomIndex = array_rand($pool);
                $winnerId = $pool[$randomIndex];

                // Add to tier winners
                $tierWinners[] = $winnerId;

                // Remove all instances of this winner from pool (can't win same tier twice)
                $pool = array_filter($pool, fn($id) => $id !== $winnerId);
                $pool = array_values($pool); // Re-index array
            }

            // Save tier winners and send notifications
            foreach ($tierWinners as $winnerId) {
                $tier->winners()->attach($winnerId, [
                    'selected_at' => now(),
                ]);

                // Send winner notification
                $winner = User::find($winnerId);
                if ($winner && $winner->email) {
                    $winner->notify(new \App\Notifications\GiveawayWinnerNotification($this, $tier));
                }
            }

            $selectedWinners[$tier->id] = $tierWinners;
        }

        // Update giveaway status
        $this->update(['status' => 'ended']);

        return $selectedWinners;
    }

    /**
     * Check if giveaway uses tier system
     */
    public function hasTiers(): bool
    {
        return $this->prizeTiers()->exists();
    }

    public function getPublicUrl(): string
    {
        return config('app.frontend_url') . '/giveaway/' . $this->slug;
    }
}
