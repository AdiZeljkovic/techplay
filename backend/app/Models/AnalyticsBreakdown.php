<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A day's totals for one value of one dimension.
 *
 * `kind` is which question: page, referrer, country, device, browser. Five
 * tables that differed only in their name would be five places to fix a bug.
 */
class AnalyticsBreakdown extends Model
{
    protected $table = 'analytics_daily_breakdowns';

    public $timestamps = false;

    protected $fillable = ['day', 'kind', 'value', 'label', 'visitors', 'pageviews', 'engagement_ms'];

    protected $casts = [
        'day' => 'date',
        'engagement_ms' => 'integer',
    ];
}
