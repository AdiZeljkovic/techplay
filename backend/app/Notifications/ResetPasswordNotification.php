<?php

namespace App\Notifications;

use App\Models\MailTemplate;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The password reset mail, in TechPlay's own design.
 *
 * Only the appearance is ours. The token, the single-use rule and the expiry
 * are the framework's, and the URL is still built by the closure registered in
 * AppServiceProvider so the link keeps pointing at the frontend rather than at
 * the API.
 */
class ResetPasswordNotification extends ResetPassword
{
    public $notifiable = null;

    public function toMail($notifiable)
    {
        $this->notifiable = $notifiable;

        return parent::toMail($notifiable);
    }

    protected function buildMailMessage($url): MailMessage
    {
        $minutes = config('auth.passwords.users.expire', 60);
        $vars = ['name' => $this->notifiable?->username ?: '', 'minutes' => $minutes];

        /*
         * Editable words, untouchable link.
         *
         * $url is the signed, single-use, expiring URL the framework built. No
         * template sees it. Somebody rewriting this mail in the admin cannot
         * remove the one thing a locked-out member needs from it — and if they
         * empty every field, the fallbacks below are what goes out.
         */
        return (new MailMessage)
            ->subject(MailTemplate::value('reset-password', 'subject', 'Set a new password — TechPlay', $vars))
            // Both halves. A mail carrying only HTML reads as a mailing to a
            // filter — ours scored MIME_HTML_ONLY for it — and the text part is
            // also what reaches somebody with images off.
            ->view(['emails.auth.reset', 'emails.auth.reset-text'], [
                'url' => $url,
                'username' => $this->notifiable?->username ?: null,
                'appUrl' => rtrim(config('app.frontend_url'), '/'),
                'expiresInMinutes' => $minutes,
                'heading' => MailTemplate::value('reset-password', 'heading', 'Set a new password', $vars),
                'bodyCopy' => MailTemplate::value(
                    'reset-password',
                    'body',
                    'Somebody asked to reset the password on this account. If that was you, the button below takes you straight to a new one.',
                    $vars
                ),
                'ctaLabel' => MailTemplate::value('reset-password', 'cta_label', 'SET NEW PASSWORD', $vars),
            ]);
    }
}
