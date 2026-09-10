<?php

namespace App\Mail;

use App\Models\MailTemplate;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterVerification extends Mailable
{
    use Queueable, SerializesModels;

    public $subscriber;

    public $verificationUrl;

    public function __construct(NewsletterSubscriber $subscriber)
    {
        $this->subscriber = $subscriber;
        // env() outside a config file returns null once config:cache has run, and
        // production runs it — so this link went out as
        // "/newsletter/verify?token=…" with no host in front of it.
        $this->verificationUrl = rtrim((string) config('app.site_url'), '/')
            .'/newsletter/verify?token='.$subscriber->verification_token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: MailTemplate::value(
                'newsletter-verification',
                'subject',
                'Confirm your TechPlay newsletter subscription'
            ),
        );
    }

    public function content(): Content
    {
        /*
         * Both halves, and the words from the template.
         *
         * This mail had neither. It went out as HTML only — the same
         * MIME_HTML_ONLY the account mail was fixed for, unnoticed here
         * because nothing was measuring it — and in the white Bootstrap design
         * the shared layout was written to replace.
         *
         * The confirmation link is built in the constructor and no template
         * touches it, which is the same arrangement the account mail has.
         */
        return new Content(
            view: 'emails.newsletter.verification',
            text: 'emails.newsletter.verification-text',
            with: [
                'appUrl' => rtrim((string) config('app.site_url'), '/'),
                'heading' => MailTemplate::value(
                    'newsletter-verification',
                    'heading',
                    'Confirm your subscription'
                ),
                'bodyCopy' => MailTemplate::value(
                    'newsletter-verification',
                    'body',
                    "Thanks for signing up. Confirm this address and the newsletter starts arriving.\n\nIt is one mail when there is something worth sending — not a schedule for its own sake."
                ),
                'bodyCopyText' => MailTemplate::value(
                    'newsletter-verification',
                    'body',
                    'Thanks for signing up. Confirm this address and the newsletter starts arriving.'
                ),
                'ctaLabel' => MailTemplate::value(
                    'newsletter-verification',
                    'cta_label',
                    'CONFIRM SUBSCRIPTION'
                ),
            ],
        );
    }
}
