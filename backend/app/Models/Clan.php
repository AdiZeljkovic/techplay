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
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'member_limit' => 'integer',
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

    public function isFull(): bool
    {
        return $this->members()->count() >= $this->member_limit;
    }

    public function hasMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }
}
