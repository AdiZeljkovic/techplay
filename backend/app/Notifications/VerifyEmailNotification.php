<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The confirmation mail, in TechPlay's own design.
 *
 * Laravel's built-in version renders through the vendor markdown theme, which
 * on this site was still a deep blue left over from an earlier look — one of
 * three unrelated email designs in the codebase. This keeps everything the
 * framework does about signing and expiry and replaces only what it looks like.
 *
 * The signed URL, its expiry window and the hash of the address all still come
 * from VerifyEmail::verificationUrl().
 */
class VerifyEmailNotification extends VerifyEmail
{
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Confirm your email — TechPlay')
            // Both halves. A mail carrying only HTML reads as a mailing to a
            // filter — ours scored MIME_HTML_ONLY for it — and the text part is
            // also what reaches somebody with images off.
            ->view(['emails.auth.verify', 'emails.auth.verify-text'], [
                'url' => $url,
                'username' => $this->recipientName(),
                'appUrl' => rtrim(config('app.frontend_url'), '/'),
                'expiresInMinutes' => config('auth.verification.expire', 60),
            ]);
    }

    /**
     * The name the reader would recognise, or nothing.
     *
     * A greeting addressed to a blank is worse than no greeting, and the
     * templates are written so that both read correctly.
     */
    private function recipientName(): ?string
    {
        $user = $this->notifiable ?? null;

        return $user?->username ?: null;
    }

    /** Held so buildMailMessage can read the recipient. */
    public $notifiable = null;

    public function toMail($notifiable)
    {
        $this->notifiable = $notifiable;

        return parent::toMail($notifiable);
    }
}
