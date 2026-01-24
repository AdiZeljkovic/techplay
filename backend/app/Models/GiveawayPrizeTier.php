<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GiveawayPrizeTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'giveaway_id',
        'tier_name',
        'prize_description',
        'winner_count',
        'min_points',
        'sort_order',
    ];

    protected $casts = [
        'winner_count' => 'integer',
        'min_points' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Get the giveaway that owns this prize tier
     */
    public function giveaway(): BelongsTo
    {
        return $this->belongsTo(Giveaway::class);
    }

    /**
     * Get the winners for this prize tier
     */
    public function winners(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'giveaway_tier_winners', 'prize_tier_id', 'user_id')
            ->withTimestamps()
            ->withPivot('selected_at');
    }

    /**
     * Check if this tier has all winners selected
     */
    public function hasAllWinners(): bool
    {
        return $this->winners()->count() >= $this->winner_count;
    }

    /**
     * Get remaining winner slots
     */
    public function getRemainingSlots(): int
    {
        return max(0, $this->winner_count - $this->winners()->count());
    }

    /**
     * Get qualified entries for this tier
     */
    public function getQualifiedEntries()
    {
        return $this->giveaway->entries()
            ->where('total_points', '>=', $this->min_points)
            ->whereNotIn('user_id', function ($query) {
                // Exclude users who already won in any tier
                $query->select('user_id')
                    ->from('giveaway_tier_winners')
                    ->whereIn('prize_tier_id', function ($subQuery) {
                        $subQuery->select('id')
                            ->from('giveaway_prize_tiers')
                            ->where('giveaway_id', $this->giveaway_id);
                    });
            });
    }
}
