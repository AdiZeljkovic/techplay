<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Queued, because the caller sends these in a loop.
 *
 * A reply notifies the thread's author and then every watcher, one by one, in
 * the request that posted it. On a thread with fifty watchers that was fifty
 * synchronous writes before the poster saw their own reply appear — the busier
 * a thread got, the slower it became to take part in.
 */
class ForumReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Post $post,
        protected Thread $thread,
        protected User $replier,
    ) {}

    /**
     * In-app always; email only if the member asked for it.
     *
     * A reply to your own thread is the one forum event worth an email — it is
     * the answer you were waiting for, and you are not on the site to see the
     * bell. Everything else stays in-app, because a forum that emails on every
     * event is a forum people mute.
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (($notifiable->email_notifications ?? false) && $notifiable->hasVerifiedEmail()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $who = $this->replier->display_name ?? $this->replier->username;
        $base = rtrim((string) config('app.frontend_url'), '/');
        $url = $base."/forum/thread/{$this->thread->slug}?post={$this->post->id}#post-{$this->post->id}";

        return (new MailMessage)
            ->subject($who.' replied to "'.$this->thread->title.'"')
            ->greeting('Someone answered.')
            ->line($who.' replied to your thread "'.$this->thread->title.'".')
            // Plain text, and short: the mail is a pointer to the thread rather
            // than a copy of it, and pasting somebody's markup into an email is
            // how an image in a post becomes a tracking pixel in an inbox.
            ->line(substr(strip_tags($this->post->content ?? ''), 0, 300))
            ->action('Read the reply', $url)
            ->line('You can turn these off in your profile settings.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'forum_reply',
            'thread_id' => $this->thread->id,
            'thread_slug' => $this->thread->slug,
            'thread_title' => $this->thread->title,
            'replier_name' => $this->replier->display_name ?? $this->replier->username,
            'post_preview' => substr(strip_tags($this->post->content), 0, 100),
        ];
    }
}
