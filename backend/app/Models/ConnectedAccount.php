<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class ConnectedAccount extends Model
{
    /**
     * The set the column used to enforce, plus the one it refused.
     *
     * `expired` is PlayStation's: the refresh token aged out and only the
     * reader can renew it, so the weekly re-sync leaves those alone rather
     * than retrying a thing that cannot succeed. It lived in the code and in
     * the settings screen for months while the database rejected it — the list
     * lives here now, beside the code that assigns it.
     */
    /**
     * `private` is Steam answering with a 200 and no library: the account's
     * Game details are not public. It is not an error — nothing failed on
     * our side and retrying changes nothing until the reader flips one
     * setting — and it is emphatically not `done`, which is how it read
     * for the first account it happened to.
     */
    public const SYNC_STATUSES = ['idle', 'pending', 'syncing', 'done', 'error', 'expired', 'private'];

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
