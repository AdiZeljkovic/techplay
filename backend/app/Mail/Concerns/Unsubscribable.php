<?php

namespace App\Mail\Concerns;

use App\Models\NewsletterSubscriber;
use Symfony\Component\Mime\Email;

/**
 * The two headers that decide whether bulk mail arrives at all.
 *
 * We send from our own mail server, which makes these more important rather
 * than less. The requirement is not about who sends — it is about who
 * *receives*: since February 2024 Gmail and Yahoo demand `List-Unsubscribe` and
 * `List-Unsubscribe-Post` on bulk mail landing in their inboxes, whatever server
 * it came from. A large sender arrives with a reputation already built. A mail
 * server of our own arrives with none, so the mechanical signals are all the
 * filter has to go on, and it reads every one of them.
 *
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click` is a promise that the URL
 * acts on a POST with no confirmation step (RFC 8058). Our route keeps that
 * promise; do not put an "are you sure" page in front of it, because the mail
 * client never sees the page — it only records that the promise was broken.
 *
 * Transactional mail does not get these. A password reset is not something to
 * opt out of, and marking it as bulk would be a lie told to the filter.
 */
trait Unsubscribable
{
    /**
     * Apply the headers for one recipient.
     *
     * Called from a Mailable's `withSymfonyMessage()`.
     */
    protected function addUnsubscribeHeaders(Email $message, NewsletterSubscriber $subscriber): void
    {
        $headers = $message->getHeaders();

        // Angle brackets are required by RFC 2369, and several clients ignore
        // the header without them.
        $headers->addTextHeader('List-Unsubscribe', '<'.$subscriber->unsubscribeUrl().'>');
        $headers->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
    }
}
