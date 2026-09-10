<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Which link, by whom, when.
 *
 * A row per click rather than a counter, because the useful question is not
 * "how many clicks" but "which of the three things we put in the mail did
 * anybody care about" — and a counter cannot answer that.
 */
class MailCampaignClick extends Model
{
    public $timestamps = false;

    protected $fillable = ['recipient_id', 'url', 'clicked_at'];

    protected $casts = [
        'clicked_at' => 'datetime',
    ];

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(MailCampaignRecipient::class, 'recipient_id');
    }
}
