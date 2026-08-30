<?php

namespace App\Notifications;

use App\Models\Giveaway;
use App\Models\GiveawayPrizeTier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class GiveawayWinnerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Giveaway $giveaway,
        public ?GiveawayPrizeTier $tier = null
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
            'type' => 'giveaway_won',
            'title' => 'You won: '.$this->giveaway->title,
            'message' => $this->prizeName().' — we will contact you about claiming it.',
            'link' => '/giveaway/'.$this->giveaway->slug,
            'giveaway_id' => $this->giveaway->id,
            'tier_id' => $this->tier?->id,
        ];
    }

    /**
     * Get the mail representation of the notification.
     */

    /** A tiered giveaway names the prize on the tier; a plain one on itself. */
    private function prizeName(): string
    {
        return $this->tier
            ? $this->tier->tier_name.' - '.$this->tier->prize_description
            : $this->giveaway->prize_name;
    }
}
