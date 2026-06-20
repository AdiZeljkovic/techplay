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
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $prizeName = $this->tier
            ? $this->tier->tier_name.' - '.$this->tier->prize_description
            : $this->giveaway->prize_name;

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

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'giveaway_id' => $this->giveaway->id,
            'giveaway_slug' => $this->giveaway->slug,
            'prize_name' => $this->giveaway->prize_name,
            'tier_id' => $this->tier?->id,
            'tier_name' => $this->tier?->tier_name,
        ];
    }
}
