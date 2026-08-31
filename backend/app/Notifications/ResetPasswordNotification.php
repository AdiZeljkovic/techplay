<?php

namespace App\Notifications;

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
        return (new MailMessage)
            ->subject('Set a new password — TechPlay')
            ->view('emails.auth.reset', [
                'url' => $url,
                'username' => $this->notifiable?->username ?: null,
                'appUrl' => rtrim(config('app.frontend_url'), '/'),
                'expiresInMinutes' => config('auth.passwords.users.expire', 60),
            ]);
    }
}
