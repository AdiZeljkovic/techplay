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

    /**
     * A digest that can only arrive by mail does not arrive at all here — the
     * mail host has no DNS record, so the Friday run has been sending nothing
     * for weeks while reporting success. The bell version is a summary line
     * rather than the whole letter; it is a nudge back to the profile, and the
     * profile is where all of it already lives.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
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
