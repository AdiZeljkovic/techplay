<?php

namespace App\Notifications;

use App\Models\Giveaway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GiveawayReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Giveaway $giveaway
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
        $hoursRemaining = $this->giveaway->getTimeRemaining() / 3600;

        return (new MailMessage)
            ->subject('⏰ Giveaway Ending Soon: '.$this->giveaway->title)
            ->greeting('Hey '.$notifiable->username.'! 👋')
            ->line('The giveaway for **'.$this->giveaway->prize_name.'** is ending in less than 24 hours!')
            ->line('**Time Remaining:** '.round($hoursRemaining).' hours')
            ->line('**Your Current Points:** '.($notifiable->entries()->where('giveaway_id', $this->giveaway->id)->first()?->total_points ?? 0))
            ->line('This is your last chance to complete tasks and increase your chances of winning!')
            ->action('View Giveaway', $this->giveaway->getPublicUrl())
            ->line('Good luck! 🍀')
            ->salutation('Best regards, The TechPlay Team');
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
        ];
    }
}
