<?php

namespace App\Notifications;

use App\Models\User;
use Filament\Notifications\Actions\Action;
use Filament\Notifications\Notification as FilamentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Something the panel should know about, addressed to staff.
 *
 * The `notifications` table had 157 rows before this class existed and every
 * one was written for a **player** — achievements, quests, rank-ups, all read
 * on techplay.gg. Nothing had ever spoken to an administrator through it.
 *
 * So the bell that was just switched on in the top bar would have shown the one
 * admin account its own achievements and nothing else. This is what gives it
 * something to say.
 *
 * Deliberately not queued. An alert about the queue being broken must not be
 * delivered by the queue.
 */
class AdminAlert extends Notification
{
    use Queueable;

    public function __construct(
        protected string $title,
        protected ?string $body = null,
        protected string $colour = 'warning',
        protected string $icon = 'heroicon-o-exclamation-triangle',
        protected ?string $url = null,
        protected ?string $urlLabel = null,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toDatabase(object $notifiable): array
    {
        $notification = FilamentNotification::make()
            ->title($this->title)
            ->icon($this->icon)
            ->color($this->colour);

        if ($this->body !== null) {
            $notification->body($this->body);
        }

        if ($this->url !== null) {
            $notification->actions([
                Action::make('open')
                    ->label($this->urlLabel ?? 'Open')
                    ->url($this->url)
                    ->markAsRead(),
            ]);
        }

        return $notification->getDatabaseMessage();
    }

    /**
     * Everyone who can open the panel.
     *
     * There is one such account today. Written as a query rather than a
     * constant so the second one is included the day it exists.
     */
    public static function send(
        string $title,
        ?string $body = null,
        string $colour = 'warning',
        string $icon = 'heroicon-o-exclamation-triangle',
        ?string $url = null,
        ?string $urlLabel = null,
    ): int {
        $admins = User::query()
            ->where(fn ($q) => $q->where('role', 'admin')
                ->orWhereHas('roles', fn ($r) => $r->where('name', 'admin')))
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new self($title, $body, $colour, $icon, $url, $urlLabel));
        }

        return $admins->count();
    }
}
