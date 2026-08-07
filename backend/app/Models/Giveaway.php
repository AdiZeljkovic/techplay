<?php

namespace App\Models;

use App\Notifications\GiveawayWinnerNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
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
        'platform',
        'prize_type',
        'region',
        'entry_type',
        'entry_goal',
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
                $giveaway->slug = Str::slug($giveaway->title).'-'.Str::random(6);
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
        if ($this->hasEnded()) {
            return null;
        }

        // Carbon 3 dropped the absolute default and flipped the direction, so
        // this returned a negative for every live giveaway — and the detail
        // page, which renders the countdown only when the value is positive,
        // showed none at all.
        return max(0, now()->diffInSeconds($this->ends_at, false));
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
     * Pick a winner using weighted random selection (O(n) memory-efficient algorithm)
     * More points = higher chance to win
     *
     * PERFORMANCE: Uses cumulative weight instead of building massive array
     * Old: 1000 users × 100 points = 100,000 array elements (400KB+ memory)
     * New: 1000 users = 1000 iterations (4KB memory)
     *
     * SECURITY: Uses DB transaction with pessimistic lock to prevent race conditions
     */
    public function pickWinner(): ?User
    {
        return DB::transaction(function () {
            // Pessimistic lock - prevent concurrent winner selection
            $giveaway = Giveaway::where('id', $this->id)
                ->lockForUpdate()
                ->first();

            // Check if winner already selected
            if ($giveaway->winner_id) {
                throw new \Exception('Winner has already been selected for this giveaway.');
            }

            // Get all entries with points (no eager loading to save memory)
            $entries = $giveaway->entries()
                ->where('total_points', '>', 0)
                ->select('id', 'user_id', 'total_points')
                ->get();

            if ($entries->isEmpty()) {
                return null;
            }

            // Calculate total weight (sum of all points)
            $totalWeight = $entries->sum('total_points');

            // Generate random number between 1 and total weight
            $random = mt_rand(1, $totalWeight);

            // Cumulative weight selection (O(n) instead of O(n*points))
            $cumulativeWeight = 0;
            $winnerId = null;

            foreach ($entries as $entry) {
                $cumulativeWeight += $entry->total_points;
                if ($random <= $cumulativeWeight) {
                    $winnerId = $entry->user_id;
                    break;
                }
            }

            if (! $winnerId) {
                return null;
            }

            // Update giveaway with winner
            $giveaway->update([
                'winner_id' => $winnerId,
                'status' => 'ended',
                'winner_announced_at' => now(),
            ]);

            // Get winner user object
            $winner = User::find($winnerId);

            // Send winner notification (queued, won't block transaction)
            if ($winner && $winner->email) {
                $winner->notify(new GiveawayWinnerNotification($this));
            }

            return $winner;
        });
    }

    /**
     * Pick winners for all prize tiers using weighted random selection (memory-efficient)
     * Returns array of ['tier_id' => [user_ids]]
     *
     * PERFORMANCE: Uses cumulative weight for each tier (O(n*tiers) instead of O(n*points*tiers))
     * SECURITY: Uses DB transaction with lock to prevent concurrent selections
     */
    public function pickWinnersByTiers(): array
    {
        return DB::transaction(function () {
            // Pessimistic lock
            $giveaway = Giveaway::where('id', $this->id)
                ->lockForUpdate()
                ->first();

            // Check if already ended
            if ($giveaway->status === 'ended') {
                throw new \Exception('Winners have already been selected for this giveaway.');
            }

            $tiers = $giveaway->prizeTiers()->orderBy('sort_order')->get();

            if ($tiers->isEmpty()) {
                // Fallback to single winner if no tiers defined
                $winner = $this->pickWinner();

                return $winner ? ['single' => [$winner->id]] : [];
            }

            $selectedWinners = [];
            $globalSelectedUserIds = []; // Track all winners across tiers

            foreach ($tiers as $tier) {
                $tierWinners = [];

                // Get qualified entries (exclude already selected winners)
                $qualifiedEntries = $tier->getQualifiedEntries()
                    ->whereNotIn('user_id', $globalSelectedUserIds)
                    ->select('id', 'user_id', 'total_points')
                    ->get();

                if ($qualifiedEntries->isEmpty()) {
                    continue;
                }

                // Pick multiple winners for this tier using cumulative weight
                for ($i = 0; $i < $tier->winner_count; $i++) {
                    if ($qualifiedEntries->isEmpty()) {
                        break;
                    }

                    // Calculate total weight for remaining entries
                    $totalWeight = $qualifiedEntries->sum('total_points');

                    if ($totalWeight === 0) {
                        break;
                    }

                    // Random number between 1 and total weight
                    $random = mt_rand(1, $totalWeight);

                    // Cumulative selection
                    $cumulativeWeight = 0;
                    $selectedEntry = null;

                    foreach ($qualifiedEntries as $entry) {
                        $cumulativeWeight += $entry->total_points;
                        if ($random <= $cumulativeWeight) {
                            $selectedEntry = $entry;
                            break;
                        }
                    }

                    if (! $selectedEntry) {
                        continue;
                    }

                    // Add to tier winners
                    $winnerId = $selectedEntry->user_id;
                    $tierWinners[] = $winnerId;
                    $globalSelectedUserIds[] = $winnerId;

                    // Remove from pool (can't win same tier twice)
                    $qualifiedEntries = $qualifiedEntries->reject(fn ($e) => $e->user_id === $winnerId);
                }

                // Save tier winners and send notifications
                foreach ($tierWinners as $winnerId) {
                    $tier->winners()->attach($winnerId, [
                        'selected_at' => now(),
                    ]);

                    // Send winner notification (queued)
                    $winner = User::find($winnerId);
                    if ($winner && $winner->email) {
                        $winner->notify(new GiveawayWinnerNotification($this, $tier));
                    }
                }

                $selectedWinners[$tier->id] = $tierWinners;
            }

            // Update giveaway status
            $giveaway->update([
                'status' => 'ended',
                'winner_announced_at' => now(),
            ]);

            return $selectedWinners;
        });
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
        return config('app.frontend_url').'/giveaway/'.$this->slug;
    }
}
