<?php

namespace App\Notifications;

use App\Models\MailTemplate;
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
        $minutes = config('auth.verification.expire', 60);
        $vars = ['name' => $this->recipientName() ?: '', 'minutes' => $minutes];

        /*
         * The words can be edited from the admin; the link cannot.
         *
         * $url is the signed, expiring URL the framework built, and it is
         * passed straight through — no template ever touches it. That is the
         * whole arrangement: an editor can rewrite every sentence in this mail
         * and still cannot break the one thing a new member needs it for.
         */
        return (new MailMessage)
            ->subject(MailTemplate::value('verify-email', 'subject', 'Confirm your email — TechPlay', $vars))
            // Both halves. A mail carrying only HTML reads as a mailing to a
            // filter — ours scored MIME_HTML_ONLY for it — and the text part is
            // also what reaches somebody with images off.
            ->view(['emails.auth.verify', 'emails.auth.verify-text'], [
                'url' => $url,
                'username' => $this->recipientName(),
                'appUrl' => rtrim(config('app.frontend_url'), '/'),
                'expiresInMinutes' => $minutes,
                'heading' => MailTemplate::value('verify-email', 'heading', 'Confirm your email', $vars),
                'bodyCopy' => MailTemplate::value(
                    'verify-email',
                    'body',
                    "Confirm this address and your account is ready.\n\nUntil you do, you can look around but not post, rate or collect — we confirm addresses so that nobody can sign up as you.",
                    $vars
                ),
                /*
                 * The same template field, two fallbacks.
                 *
                 * The plain-text half was never a transcription of the HTML —
                 * it says the same thing more plainly, and that was a deliberate
                 * choice worth keeping. But once an editor rewrites the copy the
                 * two must not drift, so both halves read the template and only
                 * disagree while nobody has written one.
                 */
                'bodyCopyText' => MailTemplate::value(
                    'verify-email',
                    'body',
                    'Confirm this address and your TechPlay account is live — library, XP, ranks and everything on the profile.',
                    $vars
                ),
                'ctaLabel' => MailTemplate::value('verify-email', 'cta_label', 'CONFIRM EMAIL', $vars),
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
