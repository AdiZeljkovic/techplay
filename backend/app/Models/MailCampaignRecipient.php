<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * One person, one campaign, and the record of what became of it.
 *
 * This row is the answer to "did they get it", which nothing could answer
 * before: sending was a command that wrote to a list and kept nothing.
 *
 * It is also the addressee of the tracking. The token belongs to this row
 * rather than to the person, so a link forwarded out of one newsletter cannot
 * be used to read anything about the next one.
 */
class MailCampaignRecipient extends Model
{
    public const QUEUED = 'queued';

    public const SENT = 'sent';

    public const FAILED = 'failed';

    protected $fillable = [
        'campaign_id', 'email', 'user_id', 'source', 'token', 'status',
        'sent_at', 'failed_reason',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $recipient) {
            $recipient->token ??= Str::random(40);
        });
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(MailCampaign::class, 'campaign_id');
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(MailCampaignClick::class, 'recipient_id');
    }

    /** The 1x1 that says the message was opened. */
    public function openUrl(): string
    {
        return URL::route('mail.open', ['token' => $this->token]);
    }

    /**
     * A link in the body, wrapped so the click is counted.
     *
     * The destination is signed. Without that this route is an open redirect
     * with our domain's name on it — anybody could hand out
     * techplay.gg/m/c/... pointing anywhere they liked, and it would carry
     * whatever trust our address has. The signature is the whole reason this
     * is safe to expose.
     */
    public function clickUrl(string $target): string
    {
        return URL::signedRoute('mail.click', [
            'token' => $this->token,
            'u' => $target,
        ]);
    }

    /**
     * The address's way out, valid whether or not they ever signed up.
     *
     * A member who never used the footer form still has to be able to leave,
     * and RFC 8058 requires the header on bulk mail regardless. So the
     * subscriber row is created on the way out if it is missing — as an
     * account signup, which is the truth of how we got the address.
     */
    public function unsubscribeUrl(): string
    {
        return $this->subscriber()->unsubscribeUrl();
    }

    public function subscriber(): NewsletterSubscriber
    {
        // forAddress() rather than a firstOrCreate of our own: it is where the
        // unsubscribe token gets minted and where an account address is marked
        // as already proved. Rolling that again here would be a second copy of
        // a rule that has to have exactly one.
        return NewsletterSubscriber::forAddress(
            $this->email,
            $this->source === NewsletterSubscriber::FROM_FORM
                ? NewsletterSubscriber::FROM_FORM
                : NewsletterSubscriber::FROM_ACCOUNT
        );
    }
}
