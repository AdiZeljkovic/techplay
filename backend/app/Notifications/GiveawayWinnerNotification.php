<?php

namespace App\Notifications;

use App\Models\Giveaway;
use App\Models\GiveawayPrizeTier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GiveawayWinnerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Giveaway $giveaway,
        public ?GiveawayPrizeTier $tier = null
    ) {}

    /**
     * The bell first, the inbox second.
     *
     * This was mail-only. Outbound mail from this site does not work — the host
     * in MAIL_HOST has no DNS record — so telling somebody they had won was a
     * message written into a socket that never opened, and there was no second
     * channel to notice. Whoever won anything since then has not been told.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
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
    public function toMail(object $notifiable): MailMessage
    {
        $prizeName = $this->prizeName();

        return (new MailMessage)
            ->subject('🎉 YOU WON: '.$this->giveaway->title)
            ->greeting('🏆 CONGRATULATIONS '.strtoupper($notifiable->username).'! 🏆')
            ->line('**You are the winner of:**')
            ->line('# '.$prizeName)
            ->line('You won our '.$this->giveaway->title.' giveaway!')
            ->line('---')
            ->line('**What happens next?**')
            ->line('Our team will contact you within 24-48 hours via email with instructions on how to claim your prize.')
            ->line('Please make sure to check your spam folder and add us to your contacts.')
            ->action('View Giveaway', $this->giveaway->getPublicUrl())
            ->line('Thank you for being part of the TechPlay community! 🎮')
            ->salutation('Congratulations again, The TechPlay Team');
    }

    /** A tiered giveaway names the prize on the tier; a plain one on itself. */
    private function prizeName(): string
    {
        return $this->tier
            ? $this->tier->tier_name.' - '.$this->tier->prize_description
            : $this->giveaway->prize_name;
    }
}
