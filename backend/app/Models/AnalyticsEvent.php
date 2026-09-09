<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One hit, as it arrived. Pruned after ninety days by `analytics:prune`.
 *
 * There is no `updated_at` and no `created_at`: a hit happened once, at
 * `occurred_at`, and nothing ever edits it.
 */
class AnalyticsEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'visitor', 'session', 'event', 'path', 'title', 'referrer_host',
        'country', 'language', 'device', 'platform', 'browser', 'screen_w',
        'engagement_ms', 'consent', 'is_bot', 'bot_reason', 'occurred_at',
    ];

    protected $casts = [
        'is_bot' => 'boolean',
        'screen_w' => 'integer',
        'engagement_ms' => 'integer',
        'occurred_at' => 'datetime',
    ];

    /** Everything the reports read. A bot is kept, counted, and left out. */
    public function scopeReaders($query)
    {
        return $query->where('is_bot', false);
    }
}
