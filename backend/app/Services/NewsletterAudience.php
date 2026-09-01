<?php

namespace App\Services;

use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use App\Models\User;

/**
 * Who the launch mail may go to.
 *
 * Two groups, and they are not the same thing. People who typed an address into
 * the footer form asked for mail. Registered members did not — we may write to
 * them because they have an account with us, which is a different basis and is
 * why the message says so in its footer.
 *
 * Both go through the suppression list on the way out, which is the only place
 * that gets to say no. It is checked here rather than at each send site so that
 * there is exactly one answer to "may we write to this person", and a new
 * campaign cannot forget to ask.
 */
class NewsletterAudience
{
    /**
     * Every address we may write to, and which of the two it is.
     *
     * Keyed by address, so a member who also signed up through the form appears
     * once rather than twice. An unverified account is not in here: we have no
     * evidence the address reaches anybody, and mailing it is how a sender
     * earns bounces.
     *
     * @return array<string, string> address => NewsletterSubscriber::FROM_*
     */
    public function addresses(): array
    {
        $members = User::query()
            ->whereNotNull('email_verified_at')
            ->pluck('email')
            ->mapWithKeys(fn ($e) => [mb_strtolower(trim((string) $e)) => NewsletterSubscriber::FROM_ACCOUNT]);

        $signups = NewsletterSubscriber::query()
            ->mailable()
            ->pluck('email')
            ->mapWithKeys(fn ($e) => [mb_strtolower(trim((string) $e)) => NewsletterSubscriber::FROM_FORM]);

        // Someone who did both is a signup: they asked, and that is the
        // stronger of the two claims.
        $all = $members->merge($signups);

        $allowed = MailSuppression::filter($all->keys());

        return $all->only($allowed)->all();
    }
}
