<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One newsletter: its words, who it is for, and what happened to it.
 *
 * The status is the whole safety mechanism, so it is worth reading as a
 * sentence rather than a list. A campaign is a `draft` until somebody sends it.
 * It becomes `sending` in the same statement that reads it as a draft, which is
 * what stops two clicks producing two sends. `sent` is terminal and there is
 * deliberately no way back to draft: a campaign that has gone out cannot be
 * un-sent, and offering an edit button afterwards would suggest otherwise.
 *
 * The audience is stored as a rule, never as a list of addresses. It is
 * resolved at the moment of sending so that somebody who unsubscribes between
 * writing and sending is not written to — the one mistake here that cannot be
 * taken back.
 */
class MailCampaign extends Model
{
    public const DRAFT = 'draft';

    public const SCHEDULED = 'scheduled';

    public const SENDING = 'sending';

    public const SENT = 'sent';

    public const CANCELLED = 'cancelled';

    protected $fillable = [
        'name', 'subject', 'body', 'body_text', 'audience',
        'hero_eyebrow', 'hero_headline', 'hero_intro', 'hero_cta_label', 'hero_cta_url', 'hero_image',
        'status', 'scheduled_for', 'batch_size', 'pause_seconds', 'created_by',
    ];

    protected $casts = [
        'audience' => 'array',
        'scheduled_for' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function recipients(): HasMany
    {
        return $this->hasMany(MailCampaignRecipient::class, 'campaign_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The hero picture, as an address a mail client can fetch.
     *
     * A separate method rather than an accessor on the column: an accessor
     * would hand the form a URL where it expects the stored path, and the
     * upload field would lose track of its own file on every save.
     */
    public function heroImageUrl(): ?string
    {
        if (! $this->hero_image) {
            return null;
        }

        return str_starts_with($this->hero_image, 'http')
            ? $this->hero_image
            : rtrim((string) config('app.url'), '/').'/storage/'.ltrim($this->hero_image, '/');
    }

    /** Still editable, and still stoppable. */
    public function isEditable(): bool
    {
        return in_array($this->status, [self::DRAFT, self::SCHEDULED, self::CANCELLED], true);
    }

    public function hasGoneOut(): bool
    {
        return in_array($this->status, [self::SENDING, self::SENT], true);
    }

    /**
     * Claim this campaign for sending, once.
     *
     * The check and the write are one statement on purpose. Read-then-write
     * across two statements is how a double click becomes two newsletters in
     * everybody's inbox, and unlike almost everything else on this site that
     * is not something an apology fixes.
     */
    public function claimForSending(): bool
    {
        return static::query()
            ->whereKey($this->getKey())
            ->whereIn('status', [self::DRAFT, self::SCHEDULED])
            ->update([
                'status' => self::SENDING,
                'started_at' => now(),
                'updated_at' => now(),
            ]) === 1;
    }

    /** How many of the people written to opened it, as a percentage. */
    public function openRate(): ?float
    {
        return $this->sent_count > 0
            ? round($this->opened_count / $this->sent_count * 100, 1)
            : null;
    }

    public function clickRate(): ?float
    {
        return $this->sent_count > 0
            ? round($this->clicked_count / $this->sent_count * 100, 1)
            : null;
    }
}
