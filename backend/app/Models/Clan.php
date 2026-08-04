<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clan extends Model
{
    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'tag',
        'is_public',
        'member_limit',
        'focus',
        'motto',
        'region',
        'language',
        'playstyle',
        'status',
        'requirements',
        'equipped_theme',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'member_limit' => 'integer',
        'level' => 'integer',
        'xp' => 'integer',
        'intel' => 'integer',
        'materials' => 'integer',
        'prestige' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClanMember::class);
    }

    public function invites(): HasMany
    {
        return $this->hasMany(ClanInvite::class);
    }

    public function ledger(): HasMany
    {
        return $this->hasMany(ClanLedger::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ClanActivity::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(ClanApplication::class);
    }

    /** Members who earned anything for the clan inside the active window. */
    public function activeMemberCount(): int
    {
        return $this->ledger()
            ->where('created_at', '>=', now()->subDays((int) config('clan.active_window_days', 14)))
            ->whereNotNull('user_id')
            ->distinct()
            ->count('user_id');
    }

    /**
     * The roster ceiling: the founding limit plus what the Command Center
     * has added since.
     */
    public function effectiveMemberLimit(): int
    {
        $cc = (int) (ClanBuilding::levelsFor($this->id)['command_center'] ?? 0);

        return (int) $this->member_limit + $cc * (int) config('clan.member_slots_per_cc_level', 10);
    }

    public function isFull(): bool
    {
        return $this->members()->count() >= $this->effectiveMemberLimit();
    }

    public function hasMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }
}
