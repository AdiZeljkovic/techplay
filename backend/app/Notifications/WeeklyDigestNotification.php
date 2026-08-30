<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Weekly retention email: streak status, fresh articles about the user's
 * games, upcoming wishlist releases and season progress.
 */
class WeeklyDigestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $streakDays,
        public array $articles,        // [['title','url'], ...]
        public array $upcoming,        // [['name','released'], ...]
        public ?array $season,         // ['name','days_remaining'] | null
    ) {}

    /**
     * The bell, not the inbox.
     *
     * Decided 31.08.2026: TechPlay sends exactly four kinds of email — address
     * verification, password reset, the contact form, and the newsletter
     * confirmation. Everything else a member might want to know reaches them
     * in the app.
     *
     * The reason is deliverability, and it is not abstract. A domain earns its
     * way into the inbox slowly and loses it fast; a handful of "mark as spam"
     * clicks on a weekly digest costs the reputation that the verification and
     * password-reset mail depends on. Those two have to arrive, so nothing
     * optional is allowed to put them at risk.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $parts = [];

        if ($this->streakDays > 0) {
            $parts[] = "{$this->streakDays}-day streak";
        }

        if ($this->articles !== []) {
            $parts[] = count($this->articles).' new for your games';
        }

        if ($this->upcoming !== []) {
            $parts[] = count($this->upcoming).' releasing soon';
        }

        return [
            'type' => 'weekly_digest',
            'title' => 'Your week on TechPlay',
            'message' => $parts === [] ? 'Claim today’s bounty to start a streak.' : implode(' · ', $parts),
            'link' => '/profile/'.$notifiable->username,
        ];
    }
}
