<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WowAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'character_name',
        'realm_slug',
        'region',
        'class',
        'race',
        'faction',
        'level',
        'achievement_points',
        'readiness_score',
        'ai_advice',
        'missing_essentials',
        'void_mounts_count',
        'has_void_elf',
        'portrait_url',
        'view_count',
        'share_count',
    ];

    protected $casts = [
        'ai_advice' => 'array',
        'missing_essentials' => 'array',
        'has_void_elf' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope: Get top readiness scores (leaderboard)
     */
    public function scopeLeaderboard(Builder $query, int $limit = 10): Builder
    {
        return $query
            ->orderByDesc('readiness_score')
            ->orderByDesc('achievement_points')
            ->limit($limit);
    }

    /**
     * Scope: Recent analyses
     */
    public function scopeRecent(Builder $query, int $limit = 20): Builder
    {
        return $query
            ->orderByDesc('created_at')
            ->limit($limit);
    }

    /**
     * Scope: Filter by region
     */
    public function scopeRegion(Builder $query, string $region): Builder
    {
        return $query->where('region', $region);
    }

    /**
     * Scope: Filter by faction
     */
    public function scopeFaction(Builder $query, string $faction): Builder
    {
        return $query->where('faction', $faction);
    }

    /**
     * Scope: Find existing character analysis
     */
    public function scopeForCharacter(Builder $query, string $region, string $realmSlug, string $characterName): Builder
    {
        return $query->where([
            'region' => $region,
            'realm_slug' => $realmSlug,
            'character_name' => $characterName,
        ]);
    }

    /**
     * Increment view count
     */
    public function incrementViews(): void
    {
        $this->increment('view_count');
    }

    /**
     * Increment share count
     */
    public function incrementShares(): void
    {
        $this->increment('share_count');
    }

    /**
     * Get readiness quality label
     */
    public function getReadinessLabelAttribute(): string
    {
        return match (true) {
            $this->readiness_score >= 90 => 'Legendary',
            $this->readiness_score >= 75 => 'Epic',
            $this->readiness_score >= 50 => 'Rare',
            $this->readiness_score >= 25 => 'Uncommon',
            default => 'Common',
        };
    }

    /**
     * Get character armory URL
     */
    public function getArmoryUrlAttribute(): string
    {
        $regionDomain = match ($this->region) {
            'eu' => 'eu',
            'kr' => 'kr',
            'tw' => 'tw',
            default => 'us',
        };

        return "https://worldofwarcraft.blizzard.com/en-{$regionDomain}/character/{$this->region}/{$this->realm_slug}/{$this->character_name}";
    }
}
