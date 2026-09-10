<?php

namespace App\Mail;

use App\Mail\Concerns\Unsubscribable;
use App\Models\MailCampaignRecipient;
use App\Services\CampaignBody;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Symfony\Component\Mime\Email;

/**
 * A campaign, addressed to one person.
 *
 * One recipient per message and never a bcc list — the same rule the launch
 * mail was written under, and for the same reason with one more added. The
 * unsubscribe token belongs to a single address, so fifty people in one message
 * would all be handed a link that removes somebody else. Now the open pixel and
 * every tracked link carry a per-recipient token as well, so a shared message
 * would also credit one reader's clicks to another.
 */
class CampaignMessage extends Mailable
{
    use Queueable, SerializesModels, Unsubscribable;

    public function __construct(public MailCampaignRecipient $recipient)
    {
        // RFC 8058. Gmail and Yahoo have required these on bulk mail since
        // February 2024, and we send from our own server, which arrives with no
        // reputation of its own — the mechanical signals are all a filter has.
        $this->withSymfonyMessage(
            fn (Email $message) => $this->addUnsubscribeHeaders($message, $this->recipient->subscriber())
        );
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->recipient->campaign->subject);
    }

    public function content(): Content
    {
        $campaign = $this->recipient->campaign;
        $body = app(CampaignBody::class);

        return new Content(
            view: 'emails.campaign',
            text: 'emails.campaign-text',
            with: [
                'appUrl' => rtrim((string) config('app.site_url'), '/'),
                'subject' => $campaign->subject,
                'bodyHtml' => $body->trackLinks((string) $campaign->body, $this->recipient),
                'bodyText' => (string) ($campaign->body_text ?: strip_tags((string) $campaign->body)),
                'pixelUrl' => $this->recipient->openUrl(),
                'unsubscribeUrl' => $this->recipient->unsubscribeUrl(),
                'recipient' => $this->recipient,
            ],
        );
    }
}
