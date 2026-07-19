<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
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

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');

        $mail = (new MailMessage)
            ->subject('Your week on TechPlay 🎮')
            ->greeting("Hey {$notifiable->username}!");

        if ($this->streakDays > 0) {
            $mail->line("🔥 Your daily streak is at **{$this->streakDays} days** — keep it alive today!");
        } else {
            $mail->line('🔥 Your streak is waiting — claim today\'s bounty to start one.');
        }

        if (! empty($this->articles)) {
            $mail->line('**New for the games you play:**');
            foreach ($this->articles as $article) {
                $mail->line("• [{$article['title']}]({$frontend}{$article['url']})");
            }
        }

        if (! empty($this->upcoming)) {
            $mail->line('**Releasing soon from your wishlist:**');
            foreach ($this->upcoming as $game) {
                $mail->line("• {$game['name']} — {$game['released']}");
            }
        }

        if ($this->season) {
            $mail->line("🏆 **{$this->season['name']}** ends in {$this->season['days_remaining']} days — finish your season quests for the Champion badge!");
        }

        return $mail
            ->action('Open your profile', "{$frontend}/profile/{$notifiable->username}")
            ->line('You can turn this digest off in your settings.');
    }
}
