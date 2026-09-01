<?php

namespace App\Mail;

use App\Mail\Concerns\Unsubscribable;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Symfony\Component\Mime\Email;

/**
 * The launch announcement, addressed to one person.
 *
 * One recipient per message, never a bcc list. That is not politeness — the
 * unsubscribe link and the `List-Unsubscribe` header both carry a token that
 * belongs to a single address, and a message sent to fifty people at once can
 * only carry one of them. Fifty-nine readers would then be given a link that
 * unsubscribes somebody else.
 */
class NewsletterLaunch extends Mailable
{
    use Queueable, SerializesModels, Unsubscribable;

    public function __construct(public NewsletterSubscriber $subscriber)
    {
        // RFC 8058 headers, per recipient. Gmail and Yahoo have required these
        // on bulk mail since February 2024 and we send from our own server,
        // which arrives with no reputation of its own — the mechanical signals
        // are all the filter has to read.
        $this->withSymfonyMessage(
            fn (Email $message) => $this->addUnsubscribeHeaders($message, $this->subscriber)
        );
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'The new TechPlay is here');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter.launch',
            text: 'emails.newsletter.launch-text',
            with: [
                'appUrl' => rtrim((string) config('app.site_url'), '/'),
                'unsubscribeUrl' => $this->subscriber->unsubscribeUrl(),
            ],
        );
    }
}
