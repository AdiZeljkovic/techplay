<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One row a day, kept forever. Rebuilt, not accumulated, by `analytics:rollup`. */
class AnalyticsDaily extends Model
{
    protected $table = 'analytics_daily';

    protected $fillable = [
        'day', 'visitors', 'sessions', 'pageviews', 'engaged_sessions',
        'engagement_ms', 'bot_hits', 'consented_visitors',
    ];

    protected $casts = [
        'day' => 'date',
        'engagement_ms' => 'integer',
    ];
}
