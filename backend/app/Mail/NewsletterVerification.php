<?php

namespace App\Mail;

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
            subject: 'Verify Your Newsletter Subscription',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter.verification',
        );
    }
}
