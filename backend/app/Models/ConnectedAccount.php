<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class ConnectedAccount extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
        'display_name',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'scopes',
        'sync_status',
        'sync_error',
        'last_synced_at',
        'visibility',
        'metadata',
    ];

    protected $casts = [
        'scopes' => 'array',
        'metadata' => 'array',
        'token_expires_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setAccessTokenAttribute(?string $value): void
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getAccessTokenAttribute(?string $value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setRefreshTokenAttribute(?string $value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute(?string $value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }
}
