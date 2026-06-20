<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ContactFormMessage extends Mailable
{
    // Removed Queueable to send emails synchronously

    public string $senderName;

    public string $senderEmail;

    public string $contactSubject;

    public string $messageContent;

    /**
     * Create a new message instance.
     */
    public function __construct(string $name, string $email, string $subject, string $message)
    {
        $this->senderName = $name;
        $this->senderEmail = $email;
        $this->contactSubject = $subject;
        $this->messageContent = $message;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->senderEmail, $this->senderName)],
            subject: "[TechPlay Contact] {$this->contactSubject}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.contact-form',
            with: [
                'senderName' => $this->senderName,
                'senderEmail' => $this->senderEmail,
                'subject' => $this->contactSubject,
                'messageContent' => $this->messageContent,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
