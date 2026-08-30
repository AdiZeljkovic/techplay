<?php

namespace App\Notifications;

use App\Models\Giveaway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class GiveawayReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Giveaway $giveaway
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
        return [
            'type' => 'giveaway_ending',
            'title' => 'Ending soon: '.$this->giveaway->title,
            'message' => $this->giveaway->prize_name.' — last chance to add points.',
            'link' => '/giveaway/'.$this->giveaway->slug,
            'giveaway_id' => $this->giveaway->id,
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
}
