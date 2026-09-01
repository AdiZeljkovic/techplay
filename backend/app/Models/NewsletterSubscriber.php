<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NewsletterSubscriber extends Model
{
    public const FROM_FORM = 'form';

    public const FROM_ACCOUNT = 'account';

    protected $fillable = [
        'email',
        'source',
        'is_active',
        'verification_token',
        'unsubscribe_token',
        'email_verified_at',
        'unsubscribed_at',
    ];

    // SECURITY: neither token belongs in a JSON response. The verification one
    // grants a subscription; the unsubscribe one cancels somebody else's.
    protected $hidden = ['verification_token', 'unsubscribe_token'];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    /**
     * Every subscriber gets a way out, from the moment they get in.
     *
     * Generated on create and **never cleared** — unlike `verification_token`,
     * which is consumed. Somebody may click the link in a two-year-old
     * newsletter, and that link has to still work.
     */
    protected static function booted(): void
    {
        static::creating(function (self $subscriber) {
            $subscriber->unsubscribe_token ??= Str::random(64);
        });
    }

    /**
     * A row for an address, whether or not it ever signed up.
     *
     * The launch mail goes to registered members, and every recipient needs a
     * row here because the row is what carries the unsubscribe token. Creating
     * one is not a claim that they subscribed — `source` records which it is,
     * and an existing row is never rewritten: somebody who signed up through
     * the form stays `form` even if they later create an account.
     */
    public static function forAddress(string $email, string $source = self::FROM_FORM): self
    {
        $email = mb_strtolower(trim($email));

        return static::firstOrCreate(
            ['email' => $email],
            [
                'source' => $source,
                'is_active' => true,
                // An account's address is already confirmed by the account.
                'email_verified_at' => $source === self::FROM_ACCOUNT ? now() : null,
            ],
        );
    }

    /**
     * The one-click URL that goes in `List-Unsubscribe`.
     */
    public function unsubscribeUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/api/v1/newsletter/unsubscribe/'.$this->unsubscribe_token;
    }

    /**
     * Off the list, and onto the suppression list.
     *
     * Both, deliberately. Clearing the row alone would let the same address
     * back on through any other form; the suppression list is what every send
     * actually checks.
     */
    public function unsubscribe(string $source = 'newsletter'): void
    {
        $this->forceFill([
            'is_active' => false,
            'unsubscribed_at' => now(),
        ])->save();

        MailSuppression::suppress($this->email, MailSuppression::UNSUBSCRIBED, $source);
    }

    /** Subscribed, confirmed, and not since suppressed. */
    public function scopeMailable($query)
    {
        return $query->where('is_active', true)
            ->whereNotNull('email_verified_at')
            ->whereNull('unsubscribed_at');
    }
}
