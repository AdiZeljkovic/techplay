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
     * Mail cannot leave this server, so a reminder that only went by mail was
     * not a reminder. The bell reaches the entrants who are already on the site,
     * which is where they would go to add points anyway.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
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
}
